const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper to extract emails and phones
function extractContacts(text) {
  const emails = Array.from(
    new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
  );
  const phones = Array.from(
    new Set(text.match(/\+?\d[\d\s().-]{7,}\d/g) || [])
  );
  return { emails, phones };
}

// Helper to extract company name (simple heuristic)
function extractCompanyName($) {
  const title = $("title").first().text();
  const h1 = $("h1").first().text();
  return h1 || title || "";
}

function extractSocialLinks($) {
  const links = {};
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (/linkedin\.com\//i.test(href)) links.linkedin = href;
    if (/twitter\.com\//i.test(href)) links.twitter = href;
    if (/facebook\.com\//i.test(href)) links.facebook = href;
    if (/instagram\.com\//i.test(href)) links.instagram = href;
  });
  return links;
}

function extractAddress($) {
  // Try common selectors
  let address = $("address").text().trim();
  if (!address) {
    address = $("[class*='address'], [id*='address']").first().text().trim();
  }
  // Try regex for address-like patterns
  if (!address) {
    const text = $.text();
    const match = text.match(
      /\d{1,5} [\w .,-]+,? [A-Za-z .-]+,? [A-Z]{2,} ?\d{3,}/
    );
    if (match) address = match[0];
  }
  return address;
}

function extractDescription($) {
  let desc = $("meta[name='description']").attr("content") || "";
  if (!desc) desc = $("meta[property='og:description']").attr("content") || "";
  if (!desc) desc = $("p").first().text().trim();
  return desc;
}

function extractYearFounded($) {
  const text = $.text();
  const match = text.match(/(Founded|Since)\s*(in)?\s*(\d{4})/i);
  return match ? match[0] : "";
}

function extractProductsAndIndustry($) {
  // Try meta tags and visible text
  let products = "";
  let industry = "";
  const metaProducts = $(
    "meta[name='products'], meta[property='og:product']"
  ).attr("content");
  if (metaProducts) products = metaProducts;
  const metaIndustry = $(
    "meta[name='industry'], meta[property='og:industry']"
  ).attr("content");
  if (metaIndustry) industry = metaIndustry;
  // Try keywords in text
  if (!products) {
    const text = $.text();
    const prodMatch = text.match(/(Products|Services):? ([\w ,&]+)/i);
    if (prodMatch) products = prodMatch[2];
  }
  if (!industry) {
    const text = $.text();
    const indMatch = text.match(/Industry:? ([\w ,&]+)/i);
    if (indMatch) industry = indMatch[1];
  }
  return { products, industry };
}

function extractTechStack($) {
  // Look for badges, meta, or script src
  const stack = [];
  $("img[alt*='powered'], img[alt*='built'], img[alt*='tech']").each(
    (_, el) => {
      stack.push($(el).attr("alt"));
    }
  );
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (
      /react|vue|angular|jquery|bootstrap|wordpress|shopify|magento|drupal/i.test(
        src
      )
    ) {
      stack.push(src);
    }
  });
  // Try meta generator
  const metaGen = $("meta[name='generator']").attr("content");
  if (metaGen) stack.push(metaGen);
  return Array.from(new Set(stack));
}

function extractCompetitors($) {
  // Look for links or sections mentioning competitors
  const competitors = [];
  $("a, section, div").each((_, el) => {
    const text = $(el).text();
    if (/competitor|similar companies|alternatives/i.test(text)) {
      competitors.push(text.trim());
    }
  });
  return competitors.slice(0, 3); // limit to 3
}

async function scrapeWithPuppeteer(url) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
  const html = await page.content();
  await browser.close();
  const $ = cheerio.load(html);
  const companyName = extractCompanyName($);
  const contacts = extractContacts($.text());
  const social = extractSocialLinks($);
  const address = extractAddress($);
  const description = extractDescription($);
  const yearFounded = extractYearFounded($);
  const { products, industry } = extractProductsAndIndustry($);
  const techStack = extractTechStack($);
  const competitors = extractCompetitors($);
  return {
    companyName,
    website: url,
    emails: contacts.emails,
    phones: contacts.phones,
    social,
    address,
    description,
    yearFounded,
    products,
    industry,
    techStack,
    competitors,
    dynamic: true,
  };
}

async function scrapeWithCheerio(url) {
  const { data: html } = await axios.get(url, { timeout: 10000 });
  const $ = cheerio.load(html);
  const companyName = extractCompanyName($);
  const contacts = extractContacts($.text());
  const social = extractSocialLinks($);
  const address = extractAddress($);
  const description = extractDescription($);
  const yearFounded = extractYearFounded($);
  const { products, industry } = extractProductsAndIndustry($);
  const techStack = extractTechStack($);
  const competitors = extractCompetitors($);
  return {
    companyName,
    website: url,
    emails: contacts.emails,
    phones: contacts.phones,
    social,
    address,
    description,
    yearFounded,
    products,
    industry,
    techStack,
    competitors,
    dynamic: false,
  };
}

app.post("/api/scrape", async (req, res) => {
  const { url, dynamic } = req.body;
  if (!url || !/^https?:\/\//.test(url)) {
    return res.status(400).json({ error: "Invalid or missing URL." });
  }
  try {
    let result;
    if (dynamic) {
      try {
        result = await scrapeWithPuppeteer(url);
        return res.json(result);
      } catch (e) {
        // fallback to static scraping if Puppeteer fails
        try {
          result = await scrapeWithCheerio(url);
          result.error = "Dynamic scraping failed, used static scraping.";
          return res.json(result);
        } catch (err2) {
          return res
            .status(500)
            .json({
              error: "Dynamic and static scraping both failed.",
              details: err2.message,
            });
        }
      }
    } else {
      result = await scrapeWithCheerio(url);
      return res.json(result);
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to scrape the URL.", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
