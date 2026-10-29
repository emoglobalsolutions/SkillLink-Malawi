"use strict";

const SUPABASE_URL = "https://dhlwmbvaxrqbtqxqyjwn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YjsSVrcHTHmRxTfjN86d9g_eHccI-OZ";
const ADMIN_DASHBOARD_PATH = "./admin.html";

const FALLBACK_CATEGORIES = [
  { id: "graphic-design", name: "Graphic Design" },
  { id: "web-development", name: "Web Development" },
  { id: "photography", name: "Photography & Video" },
  { id: "home-services", name: "Home Services" },
  { id: "beauty", name: "Beauty & Fashion" },
  { id: "education", name: "Education & Tutoring" },
  { id: "events", name: "Events & Entertainment" },
  { id: "business-services", name: "Business Services" }
];

let supabaseClient = null;
const hasSupabaseConfig =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_YOUR_") &&
  typeof SUPABASE_PUBLISHABLE_KEY === "string" &&
  SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR_");

if (window.supabase && hasSupabaseConfig) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  } catch (error) {
    console.error("Could not initialize Supabase:", error);
  }
} else if (hasSupabaseConfig) {
  console.warn("Supabase script did not load. Join and login actions will be disabled until the script is available.");
} else {
  console.warn("Supabase is not configured. Demo mode is enabled. Add your real project URL and anon key to enable account features.");
}

document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const locationFilter = document.getElementById("locationFilter");
  const sortFilter = document.getElementById("sortFilter");
  const providerGrid = document.getElementById("providerGrid");
  const resultsCount = document.getElementById("resultsCount");
  const emptyState = document.getElementById("emptyState");
  const infoDialog = document.getElementById("infoDialog");
  const dialogContent = document.getElementById("dialogContent");
  const loginBtn = document.getElementById("loginBtn");
  const joinBtn = document.getElementById("joinBtn");
  const bottomJoinBtn = document.getElementById("bottomJoinBtn");

  const BUSINESS_WHATSAPP = "";
  const cards = Array.from(providerGrid ? providerGrid.querySelectorAll(".provider-card") : []);
  const yearElement = document.getElementById("year");

  if (yearElement) yearElement.textContent = new Date().getFullYear();

  let activeCategory = "";
  let categoryRows = [];

  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.style.cssText = "padding:12px;margin:12px;background:#e8f5e9;color:#14532d;border-radius:8px;";
  status.textContent = "Checking database connection...";
  document.body.prepend(status);

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>\"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function setStatus(message, type = "info") {
    status.textContent = message;

    if (type === "success") {
      status.style.background = "#dcfce7";
      status.style.color = "#166534";
    } else if (type === "error") {
      status.style.background = "#fee2e2";
      status.style.color = "#991b1b";
    } else {
      status.style.background = "#e0f2fe";
      status.style.color = "#0f172a";
    }
  }

  function openDialog(content) {
    dialogContent.innerHTML = content;
    if (typeof infoDialog.showModal === "function") {
      infoDialog.showModal();
    } else {
      alert("Please use a modern browser to open this form.");
    }
  }

  function closeDialog() {
    if (infoDialog && infoDialog.open) infoDialog.close();
  }

  function addPasswordToggle(input) {
    if (!input || input.dataset.passwordToggle === "true") return;

    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.width = "100%";

    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = "Show";
    toggle.setAttribute("aria-label", "Show password");
    toggle.style.position = "absolute";
    toggle.style.right = "10px";
    toggle.style.top = "50%";
    toggle.style.transform = "translateY(-50%)";
    toggle.style.border = "none";
    toggle.style.background = "transparent";
    toggle.style.color = "#0f766e";
    toggle.style.fontWeight = "700";
    toggle.style.cursor = "pointer";
    toggle.style.fontSize = "0.8rem";
    wrap.appendChild(toggle);

    input.style.paddingRight = "64px";
    input.dataset.passwordToggle = "true";

    toggle.addEventListener("click", () => {
      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      toggle.textContent = shouldShow ? "Hide" : "Show";
      toggle.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
      input.focus();
    });
  }

  function enablePasswordToggles(container = document) {
    if (!container) return;
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    passwordInputs.forEach((input) => addPasswordToggle(input));
  }

  async function isCurrentUserAdmin() {
    if (!supabaseClient) return false;
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !sessionData?.session) return false;

    const { data, error } = await supabaseClient
      .from("admins")
      .select("user_id")
      .eq("user_id", sessionData.session.user.id)
      .maybeSingle();

    return !error && !!data;
  }

  async function refreshAdminButton() {
    const headerActions = document.querySelector(".header-actions");
    if (!headerActions || !supabaseClient) return;

    const existingBtn = document.getElementById("adminDashboardBtn");
    const { data } = await supabaseClient.auth.getSession();
    const loggedIn = !!(data && data.session);

    if (!loggedIn) {
      if (existingBtn) existingBtn.remove();
      return;
    }

    const isAdmin = await isCurrentUserAdmin();

    if (existingBtn) existingBtn.remove();

    const adminButton = document.createElement("button");
    adminButton.id = "adminDashboardBtn";
    adminButton.type = "button";
    adminButton.className = "btn btn-outline";
    adminButton.textContent = isAdmin ? "Admin dashboard" : "Admin";
    adminButton.addEventListener("click", async () => {
      if (!isAdmin) {
        openDialog('<h2>Admin access required</h2><p>Your account is not registered as an admin for this dashboard.</p><button class="btn btn-primary dialog-action" id="adminDeniedClose" type="button">Close</button>');
        const adminDeniedClose = document.getElementById("adminDeniedClose");
        if (adminDeniedClose) adminDeniedClose.addEventListener("click", closeDialog);
        return;
      }
      window.location.href = ADMIN_DASHBOARD_PATH;
    });

    headerActions.insertBefore(adminButton, headerActions.firstChild);
  }

  async function testSupabaseConnection() {
    if (!supabaseClient) {
      setStatus(
        "Demo mode active: searching works without live data. Connect Supabase to enable login, registration and saved provider profiles.",
        "info"
      );
      return false;
    }

    try {
      const { data, error } = await supabaseClient.from("service_categories").select("id,name").limit(100);

      if (error) throw error;

      categoryRows = Array.isArray(data) ? data : [];
      setStatus("Success! SkillLink Malawi database is connected.", "success");
      return true;
    } catch (error) {
      console.error("Supabase connection test:", error);
      setStatus(
        "Database connection failed: " + (error.message || "Check your project URL, publishable key, and table policies."),
        "error"
      );
      return false;
    }
  }

  function filterProviders() {
    if (!providerGrid) return;

    const query = normalize(searchInput && searchInput.value);
    const district = normalize(locationFilter && locationFilter.value);
    const visibleCards = [];

    cards.forEach((card) => {
      const name = normalize(card.dataset.name);
      const category = normalize(card.dataset.category);
      const location = normalize(card.dataset.location);
      const skills = normalize(card.dataset.skills);
      const descriptionElement = card.querySelector(".provider-description");
      const description = normalize(descriptionElement ? descriptionElement.textContent : "");
      const matchesQuery = !query || name.includes(query) || category.includes(query) || skills.includes(query) || description.includes(query);
      const matchesLocation = !district || location === district;
      const selectedCategory = normalize(activeCategory);
      const matchesCategory =
        !selectedCategory ||
        category.includes(selectedCategory) ||
        (selectedCategory === "beauty" && category.includes("beauty")) ||
        (selectedCategory === "business-services" && category.includes("business")) ||
        (selectedCategory === "web-development" && category.includes("web")) ||
        (selectedCategory === "photography" && category.includes("photography"));

      const visible = matchesQuery && matchesLocation && matchesCategory;
      card.hidden = !visible;
      if (visible) visibleCards.push(card);
    });

    if (sortFilter && sortFilter.value === "name") {
      visibleCards.sort((a, b) => (a.dataset.name || "").localeCompare(b.dataset.name || ""));
    }

    visibleCards.forEach((card) => providerGrid.appendChild(card));

    if (resultsCount) {
      resultsCount.textContent = `${visibleCards.length} example profile${visibleCards.length === 1 ? "" : "s"}`;
    }

    if (emptyState) emptyState.hidden = visibleCards.length !== 0;
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      filterProviders();

      const providersSection = document.getElementById("providers");
      if (providersSection) providersSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (locationFilter) locationFilter.addEventListener("change", filterProviders);
  if (sortFilter) sortFilter.addEventListener("change", filterProviders);
  if (searchInput) searchInput.addEventListener("input", filterProviders);

  document.querySelectorAll("[data-search]").forEach((button) =>
    button.addEventListener("click", () => {
      if (searchInput) searchInput.value = button.dataset.search || "";
      activeCategory = "";
      filterProviders();

      const section = document.getElementById("providers");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    })
  );

  document.querySelectorAll("[data-category]").forEach((button) =>
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "";
      if (searchInput) searchInput.value = "";
      filterProviders();

      const section = document.getElementById("providers");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    })
  );

  document.querySelectorAll(".contact-btn").forEach((button) =>
    button.addEventListener("click", () => {
      const card = button.closest(".provider-card");
      if (!card) return;

      const name = card.dataset.name || "Example provider";
      const category = card.dataset.category || "Service";
      const location = card.dataset.location || "Malawi";
      const descriptionElement = card.querySelector(".provider-description");
      const description = descriptionElement ? descriptionElement.textContent : "";

      openDialog(`
        <span class="eyebrow">DEMO SERVICE PROFILE</span>
        <h2>${escapeHTML(name)}</h2>
        <p><strong>Service:</strong> ${escapeHTML(category)}</p>
        <p><strong>Location:</strong> ${escapeHTML(location)}</p>
        <p>${escapeHTML(description)}</p>
        <button class="btn btn-primary dialog-action" id="enquireBtn" type="button">Enquire</button>
      `);

      const enquireBtn = document.getElementById("enquireBtn");
      if (enquireBtn) enquireBtn.addEventListener("click", () => showEnquiryForm(name, category));
    })
  );

  function showEnquiryForm(providerName, category) {
    openDialog(`
      <span class="eyebrow">SERVICE ENQUIRY</span>
      <h2>Tell us what you need</h2>
      <p>Complete this form to prepare an enquiry.</p>
      <form id="enquiryForm">
        <label class="form-field">Your name
          <input name="customerName" type="text" required>
        </label>
        <label class="form-field">Phone number
          <input name="phone" type="tel" required>
        </label>
        <label class="form-field">Project details
          <textarea name="message" rows="4" required></textarea>
        </label>
        <button class="btn btn-primary dialog-action" type="submit">Send enquiry</button>
      </form>
    `);

    const enquiryForm = document.getElementById("enquiryForm");
    if (!enquiryForm) return;

    enquiryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const customerName = String(formData.get("customerName") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const message = String(formData.get("message") || "").trim();

      if (!customerName || !phone || !message) return;

      if (BUSINESS_WHATSAPP) {
        const text = [
          "SkillLink Malawi service enquiry",
          `Provider: ${providerName}`,
          `Category: ${category}`,
          `Customer: ${customerName}`,
          `Phone: ${phone}`,
          `Request: ${message}`
        ].join("\n");

        const url = "https://wa.me/" + BUSINESS_WHATSAPP.replace(/\D/g, "") + "?text=" + encodeURIComponent(text);
        openDialog(`<h2>Enquiry prepared</h2><p>Your WhatsApp enquiry is ready.</p><a class="btn btn-primary dialog-action" href="${url}" target="_blank" rel="noopener noreferrer">Open WhatsApp</a>`);
      } else {
        openDialog(`<h2>Enquiry form checked</h2><p>Your information passed validation, but it has not been delivered or saved.</p><p class="dialog-message">Connect a provider or WhatsApp number in the app to send live enquiries.</p><button class="btn btn-primary dialog-action" id="enquiryDone" type="button">Close</button>`);
        const enquiryDone = document.getElementById("enquiryDone");
        if (enquiryDone) enquiryDone.addEventListener("click", closeDialog);
      }
    });
  }

  async function loadCategoriesInto(selectElement) {
    if (!selectElement) return;

    if (!categoryRows.length) {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from("service_categories").select("id,name").order("name");
          if (error) throw error;
          categoryRows = data || [];
        } catch (error) {
          console.error("Load service categories:", error);
          categoryRows = FALLBACK_CATEGORIES;
        }
      } else {
        categoryRows = FALLBACK_CATEGORIES;
      }
    }

    selectElement.innerHTML =
      '<option value="">Select a category</option>' +
      categoryRows
        .map((item) => `<option value="${escapeHTML(String(item.id))}">${escapeHTML(item.name)}</option>`)
        .join("");
  }

  async function ensureProviderProfile(user) {
    if (!user) return { ok: false, message: "Please sign in first." };
    if (!supabaseClient) {
      return { ok: false, message: "Supabase is not connected in this app. Add your project URL and anon key to enable sign-up." };
    }

    const { data: existing, error: readError } = await supabaseClient
      .from("providers")
      .select("user_id,business_name,full_name,is_approved")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) return { ok: false, message: "Could not check your provider profile: " + readError.message };
    if (existing) return { ok: true, profile: existing, created: false };

    const metadata = user.user_metadata || {};
    const categoryId = metadata.category_id || null;

    const profile = {
      user_id: user.id,
      business_name: String(metadata.business_name || metadata.provider_name || metadata.full_name || "New provider").trim(),
      full_name: String(metadata.full_name || metadata.provider_name || "").trim(),
      category_id: categoryId,
      district: String(metadata.district || "").trim(),
      phone: String(metadata.phone || "").trim(),
      email: user.email || "",
      description: String(metadata.description || "").trim(),
      is_approved: false,
      is_verified: false,
      is_featured: false
    };

    const { data, error } = await supabaseClient
      .from("providers")
      .insert(profile)
      .select("user_id,business_name,full_name,is_approved")
      .single();

    if (error) return { ok: false, message: "You are signed in, but your provider profile could not be saved. " + error.message };
    return { ok: true, profile: data, created: true };
  }

  async function refreshAuthButton() {
    if (!supabaseClient) {
      if (loginBtn) {
        loginBtn.textContent = "Log in (demo)";
        loginBtn.setAttribute("aria-label", "Demo login is unavailable until Supabase is configured");
      }
      return;
    }

    const { data } = await supabaseClient.auth.getSession();
    const user = data && data.session ? data.session.user : null;

    if (!loginBtn) return;

    if (user) {
      loginBtn.textContent = "My account / Log out";
      loginBtn.setAttribute("aria-label", "Open account options or log out");
    } else {
      loginBtn.textContent = "Log in";
      loginBtn.setAttribute("aria-label", "Log in");
    }
  }

  function showJoinForm() {
    if (!supabaseClient) {
      openDialog(`<h2>Join is unavailable</h2><p>Supabase is not connected in this deployment yet.</p><p class="dialog-message">Add a valid project URL and anon key in app.js to enable provider registration.</p><button class="btn btn-primary dialog-action" id="joinUnavailableClose" type="button">Close</button>`);
      const joinUnavailableClose = document.getElementById("joinUnavailableClose");
      if (joinUnavailableClose) joinUnavailableClose.addEventListener("click", closeDialog);
      return;
    }

    openDialog(`
      <span class="eyebrow">JOIN OUR COMMUNITY</span>
      <h2>Create a provider account</h2>
      <p>Register to create a provider profile. New profiles remain unapproved until reviewed.</p>
      <form id="joinForm">
        <label class="form-field">Full name<input name="fullName" type="text" required></label>
        <label class="form-field">Business name<input name="businessName" type="text" required></label>
        <label class="form-field">Email address<input name="email" type="email" required></label>
        <label class="form-field">Phone number<input name="phone" type="tel" required></label>
        <label class="form-field">Password<input name="password" type="password" minlength="8" required></label>
        <label class="form-field">Confirm password<input name="confirmPassword" type="password" minlength="8" required></label>
        <label class="form-field">Service category<select id="joinCategory" name="categoryId" required></select></label>
        <label class="form-field">District<input name="district" type="text" placeholder="e.g. Blantyre" required></label>
        <button class="btn btn-primary dialog-action" type="submit">Create provider account</button>
      </form>
    `);

    const joinForm = document.getElementById("joinForm");
    enablePasswordToggles(joinForm);

    const categorySelect = document.getElementById("joinCategory");
    loadCategoriesInto(categorySelect).catch((error) => {
      console.error("Load service categories:", error);
      if (categorySelect) categorySelect.innerHTML = '<option value="">Could not load categories</option>';
    });

    joinForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitButton = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);

      const fullName = String(formData.get("fullName") || "").trim();
      const businessName = String(formData.get("businessName") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const password = String(formData.get("password") || "");
      const confirmPassword = String(formData.get("confirmPassword") || "");
      const categoryId = String(formData.get("categoryId") || "");
      const district = String(formData.get("district") || "").trim();

      if (password.length < 8) {
        alert("Please use a password with at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        alert("The passwords do not match.");
        return;
      }

      if (!categoryRows.some((item) => String(item.id) === categoryId)) {
        alert("Please choose a valid service category.");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Creating account...";

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              provider_name: businessName,
              business_name: businessName,
              phone,
              category_id: categoryId,
              district
            }
          }
        });

        if (error) throw error;

        if (data.session && data.user) {
          const result = await ensureProviderProfile(data.user);

          if (!result.ok) {
            openDialog(`<h2>Account created, profile needs attention</h2><p>Your account was created, but the provider profile could not be saved.</p><p class="dialog-message">${escapeHTML(result.message)}</p><button class="btn btn-primary dialog-action" id="continueLogin" type="button">Log in</button>`);
            document.getElementById("continueLogin").addEventListener("click", () => showLoginForm());
          } else {
            openDialog(`<h2>Welcome to SkillLink Malawi!</h2><p>Your account and provider profile have been created.</p><p class="dialog-message">Your listing is pending admin approval.</p><button class="btn btn-primary dialog-action" id="accountDone" type="button">Close</button>`);
            document.getElementById("accountDone").addEventListener("click", closeDialog);
            refreshAuthButton();
            refreshAdminButton();
          }
        } else {
          openDialog(`<h2>Check your email</h2><p>Your sign-up request was accepted for <strong>${escapeHTML(email)}</strong>.</p><p>Supabase email confirmation is enabled. Open the confirmation email, then log in to continue.</p><button class="btn btn-primary dialog-action" id="goLogin" type="button">Log in</button>`);
          document.getElementById("goLogin").addEventListener("click", showLoginForm);
        }
      } catch (error) {
        console.error("Provider sign-up:", error);
        const message = error.message || "Please try again.";
        openDialog(`<h2>Could not create account</h2><p>${escapeHTML(message)}</p><p class="dialog-message">If this email is already registered, use Log in instead. Do not share your password.</p><button class="btn btn-primary dialog-action" id="retryJoin" type="button">Try again</button>`);
        document.getElementById("retryJoin").addEventListener("click", showJoinForm);
      } finally {
        if (submitButton && submitButton.isConnected) {
          submitButton.disabled = false;
          submitButton.textContent = "Create provider account";
        }
      }
    });
  }

  function showLoginForm() {
    if (!supabaseClient) {
      openDialog(`<h2>Login is unavailable</h2><p>Supabase is not connected in this deployment yet.</p><p class="dialog-message">Add your valid project URL and publishable key in app.js to enable member login.</p><button class="btn btn-primary dialog-action" id="loginUnavailableClose" type="button">Close</button>`);
      const loginUnavailableClose = document.getElementById("loginUnavailableClose");
      if (loginUnavailableClose) loginUnavailableClose.addEventListener("click", closeDialog);
      return;
    }

    openDialog(`
      <span class="eyebrow">MEMBER ACCESS</span>
      <h2>Log in to SkillLink</h2>
      <form id="loginForm">
        <label class="form-field">Email address<input name="email" type="email" required></label>
        <label class="form-field">Password<input name="password" type="password" required></label>
        <button class="btn btn-primary dialog-action" type="submit">Log in</button>
      </form>
      <p class="dialog-message">Need an account? <button class="text-link" id="loginJoinLink" type="button">Create one here</button></p>
    `);

    const loginForm = document.getElementById("loginForm");
    enablePasswordToggles(loginForm);

    document.getElementById("loginJoinLink").addEventListener("click", showJoinForm);

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitButton = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");

      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const profileResult = await ensureProviderProfile(data.user);
        await refreshAuthButton();
        await refreshAdminButton();

        if (!profileResult.ok) {
          openDialog(`<h2>Logged in successfully</h2><p>Your account is active, but we could not finish checking the provider profile.</p><p class="dialog-message">${escapeHTML(profileResult.message)}</p><button class="btn btn-primary dialog-action" id="loginOkay" type="button">Close</button>`);
        } else {
          openDialog(`<h2>Welcome back!</h2><p>You are now logged in as <strong>${escapeHTML(data.user.email || email)}</strong>.</p><p class="dialog-message">Provider listing status is available in your account.</p><button class="btn btn-primary dialog-action" id="loginOkay" type="button">Close</button>`);
        }

        document.getElementById("loginOkay").addEventListener("click", closeDialog);
      } catch (error) {
        console.error("Login:", error);
        openDialog(`<h2>Login failed</h2><p>${escapeHTML(error.message || "Please check your email and password.")}</p><button class="btn btn-primary dialog-action" id="loginRetry" type="button">Try again</button>`);
        document.getElementById("loginRetry").addEventListener("click", showLoginForm);
      } finally {
        if (submitButton && submitButton.isConnected) {
          submitButton.disabled = false;
          submitButton.textContent = "Log in";
        }
      }
    });
  }

  async function showAccountOptions() {
    if (!supabaseClient) {
      showLoginForm();
      return;
    }

    const { data } = await supabaseClient.auth.getSession();
    const user = data && data.session ? data.session.user : null;

    if (!user) {
      showLoginForm();
      return;
    }

    const isAdmin = await isCurrentUserAdmin();
    const adminButtonMarkup = '<button class="btn btn-primary dialog-action" id="adminFromAccount" type="button">Admin dashboard</button>';

    openDialog(`<span class="eyebrow">YOUR ACCOUNT</span><h2>Account details</h2><p>${escapeHTML(user.email || "Signed-in user")}</p>${adminButtonMarkup}<button class="btn btn-primary dialog-action" id="logoutBtn" type="button">Log out</button>`);

    const adminFromAccount = document.getElementById("adminFromAccount");
    if (adminFromAccount) {
      adminFromAccount.addEventListener("click", async () => {
        if (!isAdmin) {
          openDialog('<h2>Admin access required</h2><p>Your account is not registered as an admin for this dashboard.</p><button class="btn btn-primary dialog-action" id="adminDeniedClose" type="button">Close</button>');
          const adminDeniedClose = document.getElementById("adminDeniedClose");
          if (adminDeniedClose) adminDeniedClose.addEventListener("click", closeDialog);
          return;
        }
        window.location.href = ADMIN_DASHBOARD_PATH;
      });
    }

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        openDialog(`<h2>Could not log out</h2><p>${escapeHTML(error.message)}</p>`);
        return;
      }

      await refreshAuthButton();
      await refreshAdminButton();
      openDialog(`<h2>You are logged out</h2><p>You can log in again whenever you need.</p><button class="btn btn-primary dialog-action" id="logoutDone" type="button">Close</button>`);
      document.getElementById("logoutDone").addEventListener("click", closeDialog);
    });
  }

  if (joinBtn) joinBtn.addEventListener("click", showJoinForm);
  if (bottomJoinBtn) bottomJoinBtn.addEventListener("click", showJoinForm);

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      if (!supabaseClient) {
        showLoginForm();
        return;
      }

      const { data } = await supabaseClient.auth.getSession();
      if (data && data.session) showAccountOptions();
      else showLoginForm();
    });
  }

  if (infoDialog) infoDialog.addEventListener("click", (event) => {
    if (event.target === infoDialog) infoDialog.close();
  });

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(() => {
      refreshAuthButton();
      refreshAdminButton();
    });
  }

  testSupabaseConnection();
  refreshAuthButton();
  refreshAdminButton();
  filterProviders();
});
