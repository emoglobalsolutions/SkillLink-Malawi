
"use strict";

// ========================================
// SUPABASE CONFIGURATION
// Fill in your actual values below.
// ========================================
const SUPABASE_URL = "https://dhlwmbvaxrqbtqxqyjwn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YjsSVrcHTHmRxTfjN86d9g_eHccI-OZ";

// Create the Supabase client
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", () => {
  // ========================================
  // PAGE ELEMENTS
  // ========================================
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const locationFilter = document.getElementById("locationFilter");
  const sortFilter = document.getElementById("sortFilter");
  const providerGrid = document.getElementById("providerGrid");
  const resultsCount = document.getElementById("resultsCount");
  const emptyState = document.getElementById("emptyState");
  const infoDialog = document.getElementById("infoDialog");
  const dialogContent = document.getElementById("dialogContent");

  // Add your official business WhatsApp number later.
  // Use international digits without the + sign.
  const BUSINESS_WHATSAPP = "";

  const cards = Array.from(
    providerGrid.querySelectorAll(".provider-card")
  );

  document.getElementById("year").textContent =
    new Date().getFullYear();

  let activeCategory = "";

  // ========================================
  // SUPABASE CONNECTION TEST
  // ========================================
  const status = document.createElement("p");
  status.textContent = "Checking database connection...";
  status.setAttribute("role", "status");
  status.style.cssText =
    "padding:12px;margin:12px;background:#e8f5e9;color:#14532d;border-radius:8px;";
  document.body.prepend(status);

  async function testSupabaseConnection() {
    try {
      const { error } = await supabaseClient
        .from("service_categories")
        .select("name")
        .limit(1);

      if (error) {
        console.error("Supabase database test:", error);
        status.textContent =
          "Database test failed: " + error.message;
        status.style.background = "#fee2e2";
        status.style.color = "#991b1b";
        return;
      }

      status.textContent =
        "Success! Supabase database is responding.";
      status.style.background = "#dcfce7";
      status.style.color = "#166534";
    } catch (error) {
      console.error("Supabase connection error:", error);
      status.textContent =
        "Connection error: " +
        (error.message || "Please check your URL and connection.");
      status.style.background = "#fee2e2";
      status.style.color = "#991b1b";
    }
  }

  testSupabaseConnection();

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  // ========================================
  // SEARCH, FILTER AND SORT PROVIDERS
  // ========================================
  function filterProviders() {
    const query = normalize(searchInput.value);
    const district = normalize(locationFilter.value);
    const visibleCards = [];

    cards.forEach(card => {
      const name = normalize(card.dataset.name);
      const category = normalize(card.dataset.category);
      const location = normalize(card.dataset.location);
      const skills = normalize(card.dataset.skills);
      const description = normalize(
        card.querySelector(".provider-description").textContent
      );

      const matchesQuery =
        !query ||
        name.includes(query) ||
        category.includes(query) ||
        skills.includes(query) ||
        description.includes(query);

      const matchesLocation =
        !district || location === district;

      const matchesCategory =
        !activeCategory ||
        category.includes(normalize(activeCategory)) ||
        (activeCategory === "Beauty" &&
          category.includes("beauty")) ||
        (activeCategory === "Business Services" &&
          category.includes("business"));

      const visible =
        matchesQuery && matchesLocation && matchesCategory;

      card.hidden = !visible;

      if (visible) visibleCards.push(card);
    });

    if (sortFilter.value === "name") {
      visibleCards.sort((a, b) =>
        a.dataset.name.localeCompare(b.dataset.name)
      );
    }

    visibleCards.forEach(card => providerGrid.appendChild(card));

    resultsCount.textContent =
      `${visibleCards.length} example profile` +
      (visibleCards.length === 1 ? "" : "s");

    emptyState.hidden = visibleCards.length !== 0;
  }

  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    filterProviders();

    document.getElementById("providers").scrollIntoView({
      behavior: "smooth"
    });
  });

  locationFilter.addEventListener("change", filterProviders);
  sortFilter.addEventListener("change", filterProviders);
  searchInput.addEventListener("input", filterProviders);

  document.querySelectorAll("[data-search]").forEach(button => {
    button.addEventListener("click", () => {
      searchInput.value = button.dataset.search;
      activeCategory = "";
      filterProviders();

      document.getElementById("providers").scrollIntoView({
        behavior: "smooth"
      });
    });
  });

  document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      searchInput.value = "";
      filterProviders();

      document.getElementById("providers").scrollIntoView({
        behavior: "smooth"
      });
    });
  });

  // ========================================
  // DIALOG HELPER
  // ========================================
  function openDialog(content) {
    dialogContent.innerHTML = content;

    if (typeof infoDialog.showModal === "function") {
      infoDialog.showModal();
    } else {
      alert("Please use a modern browser to open this form.");
    }
  }

  // ========================================
  // DEMO PROVIDER PROFILES
  // ========================================
  document.querySelectorAll(".contact-btn").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".provider-card");
      const name = card.dataset.name;
      const category = card.dataset.category;
      const location = card.dataset.location;
      const description = card.querySelector(
        ".provider-description"
      ).textContent;

      openDialog(`
        <span class="eyebrow">DEMO SERVICE PROFILE</span>
        <h2>${escapeHTML(name)}</h2>
        <p><strong>Service:</strong> ${escapeHTML(category)}</p>
        <p><strong>Location:</strong> ${escapeHTML(location)}</p>
        <p>${escapeHTML(description)}</p>
        <p class="dialog-message">
          This is an example listing. The provider has not been
          confirmed as a real or verified business.
        </p>
        <button class="btn btn-primary dialog-action"
          id="enquireBtn">Make an enquiry</button>
      `);

      document.getElementById("enquireBtn").addEventListener(
        "click",
        () => showEnquiryForm(name, category)
      );
    });
  });

  // ========================================
  // ENQUIRY FORM
  // ========================================
  function showEnquiryForm(providerName, category) {
    openDialog(`
      <span class="eyebrow">SERVICE ENQUIRY</span>
      <h2>Tell us what you need</h2>
      <p>Complete this sample form to prepare your enquiry.</p>
      <form id="enquiryForm">
        <label class="form-field">
          Your name
          <input name="customerName" required maxlength="100"
            autocomplete="name" placeholder="Enter your full name">
        </label>
        <label class="form-field">
          Your phone number
          <input name="phone" required maxlength="30"
            autocomplete="tel" placeholder="e.g. 0991234567">
        </label>
        <label class="form-field">
          Describe the job
          <textarea name="message" required maxlength="1500"
            placeholder="Explain the service you need"></textarea>
        </label>
        <button class="btn btn-primary dialog-action" type="submit">
          Prepare enquiry
        </button>
      </form>
      <p class="dialog-message">
        Demo mode: this form does not save or send your information
        to a server.
      </p>
    `);

    document.getElementById("enquiryForm").addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const customerName = String(
          formData.get("customerName") || ""
        ).trim();
        const phone = String(
          formData.get("phone") || ""
        ).trim();
        const message = String(
          formData.get("message") || ""
        ).trim();

        if (!customerName || !phone || !message) return;

        const enquiry = {
          provider: providerName,
          category,
          customerName,
          phone,
          message
        };

        if (BUSINESS_WHATSAPP) {
          const text = [
            "SkillLink Malawi service enquiry",
            `Provider: ${enquiry.provider}`,
            `Category: ${enquiry.category}`,
            `Customer: ${enquiry.customerName}`,
            `Phone: ${enquiry.phone}`,
            `Request: ${enquiry.message}`
          ].join("\n");

          const url =
            "https://wa.me/" +
            BUSINESS_WHATSAPP.replace(/\D/g, "") +
            "?text=" + encodeURIComponent(text);

          openDialog(`
            <h2>Enquiry prepared</h2>
            <p>Your WhatsApp enquiry is ready to open.</p>
            <a class="btn btn-primary dialog-action"
              href="${url}" target="_blank" rel="noopener noreferrer">
              Open WhatsApp
            </a>
          `);
        } else {
          openDialog(`
            <h2>Demo enquiry completed</h2>
            <p>Your form passed validation, but it has not been
              delivered or saved.</p>
            <p class="dialog-message">
              WhatsApp and database delivery will be configured
              in a later development step.
            </p>
          `);
        }
      }
    );
  }

  // ========================================
  // PROVIDER REGISTRATION PREVIEW
  // ========================================
  function showJoinForm() {
    openDialog(`
      <span class="eyebrow">JOIN OUR COMMUNITY</span>
      <h2>Become a service provider</h2>
      <p>Get ready to showcase your skills on SkillLink Malawi.</p>
      <form id="joinForm">
        <label class="form-field">
          Full name or business name
          <input name="providerName" required maxlength="120"
            autocomplete="name" placeholder="Your name or business">
        </label>
        <label class="form-field">
          Email address
          <input name="email" type="email" required maxlength="254"
            autocomplete="email" placeholder="you@example.com">
        </label>
        <label class="form-field">
          Phone number
          <input name="phone" required maxlength="30"
            autocomplete="tel" placeholder="Your contact number">
        </label>
        <label class="form-field">
          Main service
          <select name="category" required>
            <option value="">Select a category</option>
            <option>Graphic Design</option>
            <option>Web Development</option>
            <option>Photography</option>
            <option>Home Services</option>
            <option>Beauty</option>
            <option>Education</option>
            <option>Events</option>
            <option>Business Services</option>
            <option>Other</option>
          </select>
        </label>
        <label class="form-field">
          District
          <select name="location" required>
            <option value="">Select your district</option>
            <option>Lilongwe</option>
            <option>Blantyre</option>
            <option>Mzuzu</option>
            <option>Kasungu</option>
            <option>Zomba</option>
            <option>Salima</option>
            <option>Other Malawi district</option>
          </select>
        </label>
        <button class="btn btn-primary dialog-action" type="submit">
          Preview registration
        </button>
      </form>
      <p class="dialog-message">
        Demo only. Registration is not saved yet.
      </p>
    `);

    document.getElementById("joinForm").addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const name = String(
          formData.get("providerName") || ""
        ).trim();
        const email = String(
          formData.get("email") || ""
        ).trim();
        const category = String(
          formData.get("category") || ""
        ).trim();
        const location = String(
          formData.get("location") || ""
        ).trim();

        openDialog(`
          <span class="eyebrow">REGISTRATION PREVIEW</span>
          <h2>You're ready for the next step!</h2>
          <p><strong>Name:</strong> ${escapeHTML(name)}</p>
          <p><strong>Email:</strong> ${escapeHTML(email)}</p>
          <p><strong>Service:</strong> ${escapeHTML(category)}</p>
          <p><strong>District:</strong> ${escapeHTML(location)}</p>
          <p class="dialog-message">
            This information has not been saved. Real provider
            registration will be enabled after authentication
            and database setup are completed.
          </p>
        `);
      }
    );
  }

  document.getElementById("joinBtn").addEventListener(
    "click", showJoinForm
  );

  document.getElementById("bottomJoinBtn").addEventListener(
    "click", showJoinForm
  );

  // ========================================
  // LOGIN PLACEHOLDER
  // ========================================
  document.getElementById("loginBtn").addEventListener(
    "click", () => {
      openDialog(`
        <span class="eyebrow">MEMBER ACCESS</span>
        <h2>Welcome to SkillLink</h2>
        <p>Secure customer and provider login will be enabled
          in the next development phase.</p>
        <button class="btn btn-primary dialog-action"
          id="registerInstead">Join as a provider</button>
      `);

      document.getElementById("registerInstead").addEventListener(
        "click", showJoinForm
      );
    }
  );

  // ========================================
  // CLOSE DIALOG WHEN BACKGROUND IS TAPPED
  // ========================================
  infoDialog.addEventListener("click", event => {
    if (event.target === infoDialog) {
      infoDialog.close();
    }
  });

  // Show the initial demo profiles.
  filterProviders();
});