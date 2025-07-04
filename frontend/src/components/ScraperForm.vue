<template>
  <div class="scraper-ui">
    <header class="header">
      <h1>🌐 Company Web Scraper</h1>
      <p class="subtitle">Extract company details from any website</p>
    </header>
    <div class="scraper-content">
      <form class="scraper-form" @submit.prevent="scrape">
        <label for="url">Company Website URL</label>
        <input
          v-model="url"
          id="url"
          type="url"
          placeholder="e.g. https://stripe.com"
          required
          autocomplete="off"
        />
        <label class="checkbox-label">
          <input type="checkbox" v-model="dynamic" />
          Use Puppeteer (for dynamic content)
        </label>
        <button type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Scrape</span>
        </button>
        <div v-if="error" class="error-card">
          <span class="error-icon">⚠️</span> {{ error }}
        </div>
      </form>
      <div v-if="result" class="result-card scrollable-result">
        <h2>Scraped Data</h2>
        <section>
          <h3>Company Info</h3>
          <p><strong>Name:</strong> {{ result.companyName }}</p>
          <p>
            <strong>Website:</strong>
            <a :href="result.website" target="_blank">{{ result.website }}</a>
          </p>
          <p>
            <strong>Description:</strong>
            {{ result.description || "None found" }}
          </p>
          <p>
            <strong>Year Founded:</strong>
            {{ result.yearFounded || "None found" }}
          </p>
          <p><strong>Address:</strong> {{ result.address || "None found" }}</p>
        </section>
        <section>
          <h3>Contact</h3>
          <p>
            <strong>Emails:</strong>
            <span v-if="result.emails.length">{{
              result.emails.join(", ")
            }}</span>
            <span v-else>None found</span>
          </p>
          <p>
            <strong>Phones:</strong>
            <span v-if="result.phones.length">{{
              result.phones.join(", ")
            }}</span>
            <span v-else>None found</span>
          </p>
          <p>
            <strong>Social Media:</strong>
            <span v-if="Object.keys(result.social || {}).length">
              <span
                v-for="(link, key) in result.social"
                :key="key"
                class="badge badge-social"
              >
                <a :href="link" target="_blank">{{ key }}</a>
              </span>
            </span>
            <span v-else>None found</span>
          </p>
        </section>
        <section>
          <h3>Business & Tech</h3>
          <p>
            <strong>Products/Services:</strong>
            {{ result.products || "None found" }}
          </p>
          <p>
            <strong>Industry:</strong> {{ result.industry || "None found" }}
          </p>
          <p>
            <strong>Tech Stack:</strong>
            <span v-if="result.techStack && result.techStack.length">
              <span
                v-for="tech in result.techStack"
                :key="tech"
                class="badge badge-tech"
                >{{ tech }}</span
              >
            </span>
            <span v-else>None found</span>
          </p>
          <p>
            <strong>Competitors:</strong>
            <span v-if="result.competitors && result.competitors.length">{{
              result.competitors.join("; ")
            }}</span>
            <span v-else>None found</span>
          </p>
        </section>
        <section class="meta-section">
          <p>
            <strong>Dynamic scraping:</strong>
            {{ result.dynamic ? "Yes" : "No" }}
          </p>
          <p v-if="result.error" class="error">{{ result.error }}</p>
        </section>
        <button class="download-btn" @click="downloadJson">
          ⬇️ Download JSON
        </button>
      </div>
    </div>
    <footer class="footer">
      <span
        >Made with <span style="color: #e25555">♥</span> for the Web Scraper
        Assignment</span
      >
    </footer>
  </div>
</template>

<script setup>
import { ref } from "vue";

const url = ref("");
const dynamic = ref(false);
const loading = ref(false);
const error = ref("");
const result = ref(null);

async function scrape() {
  error.value = "";
  result.value = null;
  loading.value = true;
  try {
    const res = await fetch("http://localhost:3001/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.value, dynamic: dynamic.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");
    result.value = data;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function downloadJson() {
  if (!result.value) return;
  const blob = new Blob([JSON.stringify(result.value, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "scraped-company.json";
  link.click();
  URL.revokeObjectURL(link.href);
}
</script>

<style scoped>
.scraper-ui {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e3e9f7 100%);
  width: 100vw;
  min-width: 0;
  overflow-x: hidden;
}
.header {
  margin-top: 2rem;
  text-align: center;
}
.header h1 {
  font-size: 2.2rem;
  margin-bottom: 0.2rem;
  color: #2c3e50;
}
.subtitle {
  color: #6c7a89;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}
.scraper-content {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  gap: 2.5rem;
  width: 100%;
  max-width: 1200px;
  min-width: 0;
  margin-bottom: 2rem;
  box-sizing: border-box;
  overflow-x: hidden;
}
.scraper-form {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(44, 62, 80, 0.07);
  padding: 2rem 2.5rem 1.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 480px;
  flex: 1 1 400px;
  min-width: 320px;
  box-sizing: border-box;
  overflow-x: hidden;
}
.scraper-form label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #34495e;
}
.scraper-form input[type="url"] {
  padding: 0.7rem;
  border: 1px solid #cfd8dc;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 1rem;
  transition: border 0.2s;
}
.scraper-form input[type="url"]:focus {
  border: 1.5px solid #4f8cff;
  outline: none;
}
.checkbox-label {
  display: flex;
  align-items: center;
  font-size: 0.98rem;
  margin-bottom: 1.2rem;
  color: #6c7a89;
}
.scraper-form button {
  background: linear-gradient(90deg, #4f8cff 0%, #6a82fb 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
}
.scraper-form button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f8cff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
  margin-right: 0.7em;
  display: inline-block;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.result-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(44, 62, 80, 0.09);
  padding: 2rem 2.5rem 1.5rem 2.5rem;
  width: 100%;
  max-width: 600px;
  flex: 2 1 600px;
  min-width: 320px;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}
.scrollable-result {
  overflow-y: auto;
  max-height: 80vh;
  overflow-x: hidden;
}
.result-card h2 {
  color: #2c3e50;
  margin-bottom: 1.2rem;
}
.result-card section {
  margin-bottom: 1.2rem;
  border-bottom: 1px solid #e3e9f7;
  padding-bottom: 0.7rem;
}
.result-card section:last-child {
  border-bottom: none;
}
.badge {
  display: inline-block;
  padding: 0.2em 0.7em;
  border-radius: 12px;
  font-size: 0.95em;
  margin: 0 0.2em 0.2em 0;
  background: #e3e9f7;
  color: #34495e;
}
.badge-social {
  background: #eaf6ff;
  color: #1976d2;
}
.badge-tech {
  background: #f3e8ff;
  color: #7c3aed;
}
.download-btn {
  background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
  color: #222;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.2rem;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
}
.download-btn:hover {
  background: linear-gradient(90deg, #38f9d7 0%, #43e97b 100%);
}
.error-card {
  background: #fff0f0;
  color: #b00020;
  border: 1px solid #ffb3b3;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  max-width: 480px;
  display: flex;
  align-items: center;
  font-size: 1.05rem;
}
.error-icon {
  margin-right: 0.7em;
  font-size: 1.3em;
}
.footer {
  margin-top: auto;
  padding: 1.5rem 0 0.7rem 0;
  color: #6c7a89;
  font-size: 1rem;
  text-align: center;
}
@media (max-width: 1000px) {
  .scraper-content {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    max-width: 100vw;
    overflow-x: hidden;
  }
  .result-card,
  .scraper-form {
    max-width: 98vw;
    min-width: 0;
  }
}
@media (max-width: 700px) {
  .scraper-form,
  .result-card {
    padding: 1.2rem 0.7rem 1rem 0.7rem;
  }
}
</style>
