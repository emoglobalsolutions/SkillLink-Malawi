‎"use strict";
‎
‎// ========================================
‎// SUPABASE CONFIGURATION
‎// Keep the real Project URL and publishable key
‎// from your existing app.js in these two lines.
‎// Never use a service_role/secret key in browser code.
‎// ========================================
‎const SUPABASE_URL = "https://dhlwmbvaxrqbtqxqyjwn.supabase.co";
‎const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YjsSVrcHTHmRxTfjN86d9g_eHccI-OZ";
‎
‎if (!window.supabase) {
‎  console.error("Supabase JS did not load. Check the Supabase CDN script in index.html.");
‎  throw new Error("Supabase library is missing.");
‎}
‎
‎const supabaseClient = window.supabase.createClient(
‎  SUPABASE_URL,
‎  SUPABASE_PUBLISHABLE_KEY
‎);
‎
‎document.addEventListener("DOMContentLoaded", () => {
‎  const searchForm = document.getElementById("searchForm");
‎  const searchInput = document.getElementById("searchInput");
‎  const locationFilter = document.getElementById("locationFilter");
‎  const sortFilter = document.getElementById("sortFilter");
‎  const providerGrid = document.getElementById("providerGrid");
‎  const resultsCount = document.getElementById("resultsCount");
‎  const emptyState = document.getElementById("emptyState");
‎  const infoDialog = document.getElementById("infoDialog");
‎  const dialogContent = document.getElementById("dialogContent");
‎  const loginBtn = document.getElementById("loginBtn");
‎  const joinBtn = document.getElementById("joinBtn");
‎  const bottomJoinBtn = document.getElementById("bottomJoinBtn");
‎  const BUSINESS_WHATSAPP = ""; // International digits only, e.g. 265991234567
‎  const cards = Array.from(providerGrid.querySelectorAll(".provider-card"));
‎  const yearElement = document.getElementById("year");
‎  if (yearElement) yearElement.textContent = new Date().getFullYear();
‎  let activeCategory = "";
‎  let categoryRows = [];
‎
‎  // Status message
‎  const status = document.createElement("p");
‎  status.setAttribute("role", "status");
‎  status.setAttribute("aria-live", "polite");
‎  status.style.cssText = "padding:12px;margin:12px;background:#e8f5e9;color:#14532d;border-radius:8px;";
‎  status.textContent = "Checking database connection...";
‎  document.body.prepend(status);
‎
‎  function normalize(value) {
‎    return String(value || "").trim().toLowerCase();
‎  }
‎
‎  function escapeHTML(value) {
‎    return String(value == null ? "" : value).replace(/[&<>\"']/g, character => ({
‎      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
‎    })[character]);
‎  }
‎
‎  function openDialog(content) {
‎    dialogContent.innerHTML = content;
‎    if (typeof infoDialog.showModal === "function") infoDialog.showModal();
‎    else alert("Please use a modern browser to open this form.");
‎  }
‎
‎  function closeDialog() {
‎    if (infoDialog.open) infoDialog.close();
‎  }
‎
‎  async function testSupabaseConnection() {
‎    try {
‎      const { data, error } = await supabaseClient.from("service_categories").select("id,name").limit(100);
‎      if (error) throw error;
‎      categoryRows = Array.isArray(data) ? data : [];
‎      status.textContent = "Success! SkillLink Malawi database is connected.";
‎      status.style.background = "#dcfce7";
‎      status.style.color = "#166534";
‎      return true;
‎    } catch (error) {
‎      console.error("Supabase connection test:", error);
‎      status.textContent = "Database connection failed: " + (error.message || "Check your project URL, publishable key, and table policies.");
‎      status.style.background = "#fee2e2";
‎      status.style.color = "#991b1b";
‎      return false;
‎    }
‎  }
‎
‎  function filterProviders() {
‎    const query = normalize(searchInput && searchInput.value);
‎    const district = normalize(locationFilter && locationFilter.value);
‎    const visibleCards = [];
‎    cards.forEach(card => {
‎      const name = normalize(card.dataset.name);
‎      const category = normalize(card.dataset.category);
‎      const location = normalize(card.dataset.location);
‎      const skills = normalize(card.dataset.skills);
‎      const descriptionElement = card.querySelector(".provider-description");
‎      const description = normalize(descriptionElement ? descriptionElement.textContent : "");
‎      const matchesQuery = !query || name.includes(query) || category.includes(query) || skills.includes(query) || description.includes(query);
‎      const matchesLocation = !district || location === district;
‎      const selectedCategory = normalize(activeCategory);
‎      const matchesCategory = !selectedCategory || category.includes(selectedCategory) || (selectedCategory === "beauty" && category.includes("beauty")) || (selectedCategory === "business services" && category.includes("business"));
‎      const visible = matchesQuery && matchesLocation && matchesCategory;
‎      card.hidden = !visible;
‎      if (visible) visibleCards.push(card);
‎    });
‎    if (sortFilter && sortFilter.value === "name") {
‎      visibleCards.sort((a, b) => (a.dataset.name || "").localeCompare(b.dataset.name || ""));
‎    }
‎    visibleCards.forEach(card => providerGrid.appendChild(card));
‎    if (resultsCount) resultsCount.textContent = `${visibleCards.length} example profile${visibleCards.length === 1 ? "" : "s"}`;
‎    if (emptyState) emptyState.hidden = visibleCards.length !== 0;
‎  }
‎
‎  if (searchForm) searchForm.addEventListener("submit", event => {
‎    event.preventDefault(); filterProviders();
‎    const providersSection = document.getElementById("providers");
‎    if (providersSection) providersSection.scrollIntoView({ behavior: "smooth" });
‎  });
‎  if (locationFilter) locationFilter.addEventListener("change", filterProviders);
‎  if (sortFilter) sortFilter.addEventListener("change", filterProviders);
‎  if (searchInput) searchInput.addEventListener("input", filterProviders);
‎
‎  document.querySelectorAll("[data-search]").forEach(button => button.addEventListener("click", () => {
‎    if (searchInput) searchInput.value = button.dataset.search || "";
‎    activeCategory = ""; filterProviders();
‎    const section = document.getElementById("providers");
‎    if (section) section.scrollIntoView({ behavior: "smooth" });
‎  }));
‎  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => {
‎    activeCategory = button.dataset.category || "";
‎    if (searchInput) searchInput.value = "";
‎    filterProviders();
‎    const section = document.getElementById("providers");
‎    if (section) section.scrollIntoView({ behavior: "smooth" });
‎  }));
‎
‎  // Keep demo profile cards clearly labelled as examples.
‎  document.querySelectorAll(".contact-btn").forEach(button => button.addEventListener("click", () => {
‎    const card = button.closest(".provider-card");
‎    if (!card) return;
‎    const name = card.dataset.name || "Example provider";
‎    const category = card.dataset.category || "Service";
‎    const location = card.dataset.location || "Malawi";
‎    const descriptionElement = card.querySelector(".provider-description");
‎    const description = descriptionElement ? descriptionElement.textContent : "";
‎    openDialog(`<span class="eyebrow">DEMO SERVICE PROFILE</span><h2>${escapeHTML(name)}</h2><p><strong>Service:</strong> ${escapeHTML(category)}</p><p><strong>Location:</strong> ${escapeHTML(location)}</p><p>${escapeHTML(description)}</p><p class="dialog-message">This is an example listing. The provider has not been confirmed as a real or verified business.</p><button class="btn btn-primary dialog-action" id="enquireBtn" type="button">Make an enquiry</button>`);
‎    document.getElementById("enquireBtn").addEventListener("click", () => showEnquiryForm(name, category));
‎  }));
‎
‎  function showEnquiryForm(providerName, category) {
‎    openDialog(`<span class="eyebrow">SERVICE ENQUIRY</span><h2>Tell us what you need</h2><p>Complete this form to prepare an enquiry.</p><form id="enquiryForm"><label class="form-field">Your name<input name="customerName" required maxlength="100" autocomplete="name" placeholder="Enter your full name"></label><label class="form-field">Your phone number<input name="phone" required maxlength="30" autocomplete="tel" placeholder="e.g. 0991234567"></label><label class="form-field">Describe the job<textarea name="message" required maxlength="1500" placeholder="Explain the service you need"></textarea></label><button class="btn btn-primary dialog-action" type="submit">Prepare enquiry</button></form><p class="dialog-message">Enquiry delivery is not connected yet. This form does not save an enquiry to the database.</p>`);
‎    document.getElementById("enquiryForm").addEventListener("submit", event => {
‎      event.preventDefault();
‎      const formData = new FormData(event.currentTarget);
‎      const customerName = String(formData.get("customerName") || "").trim();
‎      const phone = String(formData.get("phone") || "").trim();
‎      const message = String(formData.get("message") || "").trim();
‎      if (!customerName || !phone || !message) return;
‎      if (BUSINESS_WHATSAPP) {
‎        const text = ["SkillLink Malawi service enquiry", `Provider: ${providerName}`, `Category: ${category}`, `Customer: ${customerName}`, `Phone: ${phone}`, `Request: ${message}`].join("\n");
‎        const url = "https://wa.me/" + BUSINESS_WHATSAPP.replace(/\D/g, "") + "?text=" + encodeURIComponent(text);
‎        openDialog(`<h2>Enquiry prepared</h2><p>Your WhatsApp enquiry is ready.</p><a class="btn btn-primary dialog-action" href="${url}" target="_blank" rel="noopener noreferrer">Open WhatsApp</a>`);
‎      } else {
‎        openDialog(`<h2>Enquiry form checked</h2><p>Your information passed validation, but it has not been delivered or saved.</p><p class="dialog-message">Connect a provider/customer enquiry workflow before using this on the live marketplace.</p>`);
‎      }
‎    });
‎  }
‎
‎  async function loadCategoriesInto(selectElement) {
‎    if (!selectElement) return;
‎    if (!categoryRows.length) {
‎      const { data, error } = await supabaseClient.from("service_categories").select("id,name").order("name");
‎      if (error) throw error;
‎      categoryRows = data || [];
‎    }
‎    selectElement.innerHTML = '<option value="">Select a category</option>' + categoryRows.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join("");
‎  }
‎
‎  async function ensureProviderProfile(user) {
‎    if (!user) return { ok: false, message: "Please sign in first." };
‎    const { data: existing, error: readError } = await supabaseClient.from("providers").select("user_id,business_name,full_name,is_approved").eq("user_id", user.id).maybeSingle();
‎    if (readError) return { ok: false, message: "Could not check your provider profile: " + readError.message };
‎    if (existing) return { ok: true, profile: existing, created: false };
‎
‎    const metadata = user.user_metadata || {};
‎    const categoryId = metadata.category_id || null;
‎    const profile = {
‎      user_id: user.id,
‎      business_name: String(metadata.business_name || metadata.provider_name || metadata.full_name || "New provider").trim(),
‎      full_name: String(metadata.full_name || metadata.provider_name || "").trim(),
‎      category_id: categoryId,
‎      district: String(metadata.district || "").trim(),
‎      phone: String(metadata.phone || "").trim(),
‎      email: user.email || "",
‎      description: String(metadata.description || "").trim(),
‎      is_approved: false,
‎      is_verified: false,
‎      is_featured: false
‎    };
‎    const { data, error } = await supabaseClient.from("providers").insert(profile).select("user_id,business_name,full_name,is_approved").single();
‎    if (error) return { ok: false, message: "You are signed in, but your provider profile could not be saved. " + error.message };
‎    return { ok: true, profile: data, created: true };
‎  }
‎
‎  async function refreshAuthButton() {
‎    const { data } = await supabaseClient.auth.getSession();
‎    const user = data && data.session ? data.session.user : null;
‎    if (!loginBtn) return;
‎    if (user) {
‎      loginBtn.textContent = "My account / Log out";
‎      loginBtn.setAttribute("aria-label", "Open account options or log out");
‎    } else {
‎      loginBtn.textContent = "Log in";
‎    }
‎  }
‎
‎  function showJoinForm() {
‎    openDialog(`<span class="eyebrow">JOIN OUR COMMUNITY</span><h2>Create a provider account</h2><p>Register to create a provider profile. New profiles remain unapproved until reviewed.</p><form id="joinForm"><label class="form-field">Full name<input name="fullName" required maxlength="120" autocomplete="name" placeholder="Your full name"></label><label class="form-field">Business or display name<input name="businessName" required maxlength="120" placeholder="Your business or public name"></label><label class="form-field">Email address<input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.com"></label><label class="form-field">Phone number<input name="phone" required maxlength="30" autocomplete="tel" placeholder="Your contact number"></label><label class="form-field">Create password<input name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters"></label><label class="form-field">Confirm password<input name="confirmPassword" type="password" required minlength="8" autocomplete="new-password" placeholder="Repeat your password"></label><label class="form-field">Main service<select name="categoryId" id="joinCategory" required><option value="">Loading categories...</option></select></label><label class="form-field">District<select name="district" required><option value="">Select your district</option><option>Lilongwe</option><option>Blantyre</option><option>Mzuzu</option><option>Kasungu</option><option>Zomba</option><option>Salima</option><option>Other Malawi district</option></select></label><button class="btn btn-primary dialog-action" type="submit">Create provider account</button></form><p class="dialog-message">Use an email address you can access. If email confirmation is enabled, check your inbox before logging in.</p>`);
‎    const categorySelect = document.getElementById("joinCategory");
‎    loadCategoriesInto(categorySelect).catch(error => {
‎      console.error("Load service categories:", error);
‎      categorySelect.innerHTML = '<option value="">Could not load categories</option>';
‎    });
‎    document.getElementById("joinForm").addEventListener("submit", async event => {
‎      event.preventDefault();
‎      const form = event.currentTarget;
‎      const submitButton = form.querySelector('button[type="submit"]');
‎      const formData = new FormData(form);
‎      const fullName = String(formData.get("fullName") || "").trim();
‎      const businessName = String(formData.get("businessName") || "").trim();
‎      const email = String(formData.get("email") || "").trim();
‎      const phone = String(formData.get("phone") || "").trim();
‎      const password = String(formData.get("password") || "");
‎      const confirmPassword = String(formData.get("confirmPassword") || "");
‎      const categoryId = String(formData.get("categoryId") || "");
‎      const district = String(formData.get("district") || "").trim();
‎      if (password.length < 8) { alert("Please use a password with at least 8 characters."); return; }
‎      if (password !== confirmPassword) { alert("The passwords do not match."); return; }
‎      if (!categoryRows.some(item => String(item.id) === categoryId)) { alert("Please choose a valid service category."); return; }
‎      submitButton.disabled = true;
‎      submitButton.textContent = "Creating account...";
‎      try {
‎        const { data, error } = await supabaseClient.auth.signUp({
‎          email,
‎          password,
‎          options: { data: { full_name: fullName, provider_name: businessName, business_name: businessName, phone, category_id: categoryId, district } }
‎        });
‎        if (error) throw error;
‎        if (data.session && data.user) {
‎          const result = await ensureProviderProfile(data.user);
‎          if (!result.ok) {
‎            openDialog(`<h2>Account created, profile needs attention</h2><p>Your account was created, but the provider profile could not be saved.</p><p class="dialog-message">${escapeHTML(result.message)}</p><button class="btn btn-primary dialog-action" id="continueLogin" type="button">Continue</button>`);
‎            document.getElementById("continueLogin").addEventListener("click", () => showLoginForm());
‎          } else {
‎            openDialog(`<h2>Welcome to SkillLink Malawi!</h2><p>Your account and provider profile have been created.</p><p class="dialog-message">Your listing is pending admin approval, so it will not appear as an approved public listing yet.</p><button class="btn btn-primary dialog-action" id="accountDone" type="button">Continue</button>`);
‎            document.getElementById("accountDone").addEventListener("click", closeDialog);
‎            refreshAuthButton();
‎          }
‎        } else {
‎          openDialog(`<h2>Check your email</h2><p>Your sign-up request was accepted for <strong>${escapeHTML(email)}</strong>.</p><p>Supabase email confirmation is enabled. Open the confirmation link in your email, then return here and log in. Your provider profile will be saved after you log in.</p><button class="btn btn-primary dialog-action" id="goLogin" type="button">Go to login</button>`);
‎          document.getElementById("goLogin").addEventListener("click", showLoginForm);
‎        }
‎      } catch (error) {
‎        console.error("Provider sign-up:", error);
‎        const message = error.message || "Please try again.";
‎        openDialog(`<h2>Could not create account</h2><p>${escapeHTML(message)}</p><p class="dialog-message">If this email is already registered, use Log in instead. Do not share your password with anyone.</p><button class="btn btn-primary dialog-action" id="retryJoin" type="button">Try again</button>`);
‎        document.getElementById("retryJoin").addEventListener("click", showJoinForm);
‎      } finally {
‎        if (submitButton && submitButton.isConnected) { submitButton.disabled = false; submitButton.textContent = "Create provider account"; }
‎      }
‎    });
‎  }
‎
‎  function showLoginForm() {
‎    openDialog(`<span class="eyebrow">MEMBER ACCESS</span><h2>Log in to SkillLink</h2><form id="loginForm"><label class="form-field">Email address<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label><label class="form-field">Password<input name="password" type="password" required autocomplete="current-password" placeholder="Your password"></label><button class="btn btn-primary dialog-action" type="submit">Log in</button></form><p class="dialog-message">Need an account? <button type="button" id="loginJoinLink">Register as a provider</button></p>`);
‎    document.getElementById("loginJoinLink").addEventListener("click", showJoinForm);
‎    document.getElementById("loginForm").addEventListener("submit", async event => {
‎      event.preventDefault();
‎      const form = event.currentTarget;
‎      const submitButton = form.querySelector('button[type="submit"]');
‎      const formData = new FormData(form);
‎      const email = String(formData.get("email") || "").trim();
‎      const password = String(formData.get("password") || "");
‎      submitButton.disabled = true;
‎      submitButton.textContent = "Logging in...";
‎      try {
‎        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
‎        if (error) throw error;
‎        const profileResult = await ensureProviderProfile(data.user);
‎        await refreshAuthButton();
‎        if (!profileResult.ok) {
‎          openDialog(`<h2>Logged in successfully</h2><p>Your account is active, but we could not finish checking the provider profile.</p><p class="dialog-message">${escapeHTML(profileResult.message)}</p><button class="btn btn-primary dialog-action" id="loginOkay" type="button">Close</button>`);
‎        } else {
‎          openDialog(`<h2>Welcome back!</h2><p>You are now logged in as <strong>${escapeHTML(data.user.email || email)}</strong>.</p><p class="dialog-message">Provider listing status: ${profileResult.profile.is_approved ? "approved" : "pending admin approval"}.</p><button class="btn btn-primary dialog-action" id="loginOkay" type="button">Continue</button>`);
‎        }
‎        document.getElementById("loginOkay").addEventListener("click", closeDialog);
‎      } catch (error) {
‎        console.error("Login:", error);
‎        openDialog(`<h2>Login failed</h2><p>${escapeHTML(error.message || "Please check your email and password.")}</p><button class="btn btn-primary dialog-action" id="loginRetry" type="button">Try again</button>`);
‎        document.getElementById("loginRetry").addEventListener("click", showLoginForm);
‎      }
‎    });
‎  }
‎
‎  async function showAccountOptions() {
‎    const { data } = await supabaseClient.auth.getSession();
‎    const user = data && data.session ? data.session.user : null;
‎    if (!user) { showLoginForm(); return; }
‎    openDialog(`<span class="eyebrow">YOUR ACCOUNT</span><h2>Account details</h2><p>${escapeHTML(user.email || "Signed-in user")}</p><button class="btn btn-primary dialog-action" id="logoutBtn" type="button">Log out</button>`);
‎    document.getElementById("logoutBtn").addEventListener("click", async () => {
‎      const { error } = await supabaseClient.auth.signOut();
‎      if (error) {
‎        openDialog(`<h2>Could not log out</h2><p>${escapeHTML(error.message)}</p>`);
‎        return;
‎      }
‎      await refreshAuthButton();
‎      openDialog(`<h2>You are logged out</h2><p>You can log in again whenever you need.</p><button class="btn btn-primary dialog-action" id="logoutDone" type="button">Close</button>`);
‎      document.getElementById("logoutDone").addEventListener("click", closeDialog);
‎    });
‎  }
‎
‎  if (joinBtn) joinBtn.addEventListener("click", showJoinForm);
‎  if (bottomJoinBtn) bottomJoinBtn.addEventListener("click", showJoinForm);
‎  if (loginBtn) loginBtn.addEventListener("click", async () => {
‎    const { data } = await supabaseClient.auth.getSession();
‎    if (data && data.session) showAccountOptions();
‎    else showLoginForm();
‎  });
‎
‎  if (infoDialog) infoDialog.addEventListener("click", event => {
‎    if (event.target === infoDialog) infoDialog.close();
‎  });
‎
‎  supabaseClient.auth.onAuthStateChange(() => { refreshAuthButton(); });
‎  testSupabaseConnection();
‎  refreshAuthButton();
‎  filterProviders();
‎});
‎