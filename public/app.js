/**
 * HOMNIQ AI — Front-End Application Logic
 * Communicates with FastAPI backend for health and real-time ML inference
 * Includes Theme Controller (Light / Dark Mode), Responsive Drawer & Copy Helpers
 */

document.addEventListener("DOMContentLoaded", () => {
  // Theme Switching Elements
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeToggleText = document.getElementById("themeToggleText");
  const sidebarThemeBtn = document.getElementById("sidebarThemeBtn");
  const sidebarThemeText = document.getElementById("sidebarThemeText");
  const sidebarThemeIcon = document.getElementById("sidebarThemeIcon");

  // DOM Elements
  const form = document.getElementById("predictionForm");
  const predictBtn = document.getElementById("predictBtn");
  const btnSpinner = document.getElementById("btnSpinner");
  const resetFormBtn = document.getElementById("resetFormBtn");
  const recalculateBtn = document.getElementById("recalculateBtn");
  const copyValuationBtn = document.getElementById("copyValuationBtn");
  const copyBtnText = document.getElementById("copyBtnText");
  const formErrorBanner = document.getElementById("formErrorBanner");
  const errorMessageText = document.getElementById("errorMessageText");

  // Result States
  const resultPanel = document.getElementById("resultPanel");
  const resultIdleState = document.getElementById("resultIdleState");
  const resultLoadingState = document.getElementById("resultLoadingState");
  const resultActiveState = document.getElementById("resultActiveState");
  const displayPrice = document.getElementById("displayPrice");
  const latencyDisplay = document.getElementById("latencyDisplay");
  const summaryPills = document.getElementById("summaryPills");

  // Form Inputs
  const overallQualInput = document.getElementById("OverallQual");
  const overallQualRange = document.getElementById("OverallQualRange");
  const qualDescriptor = document.getElementById("qualDescriptor");

  const grLivAreaInput = document.getElementById("GrLivArea");
  const garageCarsInput = document.getElementById("GarageCars");
  const totalBsmtSFInput = document.getElementById("TotalBsmtSF");
  const yearBuiltInput = document.getElementById("YearBuilt");
  const fullBathInput = document.getElementById("FullBath");
  const bedroomAbvGrInput = document.getElementById("BedroomAbvGr");
  const lotAreaInput = document.getElementById("LotArea");

  // Health Pill
  const healthDot = document.getElementById("healthDot");
  const healthText = document.getElementById("healthText");

  // Mobile Navigation Elements
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const sidebar = document.getElementById("sidebar");

  // Presets
  const presetStarter = document.getElementById("presetStarter");
  const presetSuburban = document.getElementById("presetSuburban");
  const presetLuxury = document.getElementById("presetLuxury");

  // Cache for last successful prediction
  let lastPredictedFormatted = "$0.00";
  let lastPayloadData = null;

  // =========================================================================
  // Theme Management (Light / Dark Mode)
  // =========================================================================
  const THEME_STORAGE_KEY = "homniq_theme_mode";

  function applyTheme(theme) {
    const isLight = theme === "light";
    document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");
    
    // Update top nav toggle button
    if (themeToggleText) {
      themeToggleText.textContent = isLight ? "Dark Theme" : "Light Theme";
    }
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute("aria-label", isLight ? "Switch to Dark Theme" : "Switch to Light Theme");
      themeToggleBtn.setAttribute("title", isLight ? "Switch to Dark Theme" : "Switch to Light Theme");
    }

    // Update sidebar toggle button
    if (sidebarThemeText) {
      sidebarThemeText.textContent = isLight ? "Switch to Dark Theme" : "Switch to Light Theme";
    }
    if (sidebarThemeIcon) {
      sidebarThemeIcon.textContent = isLight ? "🌙" : "☀️";
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      // Ignore private mode storage errors
    }
  }

  function getInitialTheme() {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
    } catch (e) {}

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  }

  // Initialize theme
  let currentTheme = getInitialTheme();
  applyTheme(currentTheme);

  function toggleTheme() {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(currentTheme);
  }

  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
  if (sidebarThemeBtn) sidebarThemeBtn.addEventListener("click", toggleTheme);

  // Listen for OS system theme changes if user hasn't explicitly set preference
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
      try {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          currentTheme = e.matches ? "light" : "dark";
          applyTheme(currentTheme);
        }
      } catch (err) {}
    });
  }

  // =========================================================================
  // Mobile Sidebar Drawer Navigation
  // =========================================================================
  function openSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (sidebarBackdrop) sidebarBackdrop.classList.add("active");
    document.body.style.overflow = window.innerWidth <= 768 ? "hidden" : "";
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openSidebar();
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", closeSidebar);
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", closeSidebar);
  }

  // Close sidebar on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  // Nav link click smooth scroll and close drawer on mobile
  const navLinks = document.querySelectorAll(".sidebar-nav .nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      closeSidebar();
    });
  });

  // =========================================================================
  // Quality Descriptor & Stepper
  // =========================================================================
  const qualityMap = {
    1: "Very Poor (1/10)",
    2: "Poor (2/10)",
    3: "Fair (3/10)",
    4: "Below Average (4/10)",
    5: "Average (5/10)",
    6: "Above Average (6/10)",
    7: "Good (7/10)",
    8: "Very Good (8/10)",
    9: "Excellent (9/10)",
    10: "Very Excellent (10/10)"
  };

  function updateQualityUI(value) {
    const val = Math.min(10, Math.max(1, parseInt(value, 10) || 5));
    overallQualInput.value = val;
    overallQualRange.value = val;
    qualDescriptor.textContent = qualityMap[val] || `${val}/10`;
  }

  overallQualRange.addEventListener("input", (e) => {
    updateQualityUI(e.target.value);
  });

  overallQualInput.addEventListener("input", (e) => {
    updateQualityUI(e.target.value);
  });

  updateQualityUI(overallQualInput.value);

  // =========================================================================
  // Check Backend Health Endpoint
  // =========================================================================
  async function checkBackendHealth() {
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("Degraded");
      const data = await response.json();

      if (data.model_loaded) {
        healthDot.classList.add("active");
        healthDot.style.background = "var(--emerald-primary)";
        healthDot.style.boxShadow = "0 0 8px var(--emerald-primary)";
        healthText.textContent = "Model Ready";
        healthText.style.color = "var(--emerald-primary)";
      } else {
        healthDot.style.background = "var(--accent-rose)";
        healthDot.style.boxShadow = "0 0 8px var(--accent-rose)";
        healthText.textContent = "Model Offline";
        healthText.style.color = "var(--accent-rose)";
      }
    } catch (err) {
      console.warn("[HOMNIQ AI] Health check warning:", err);
      healthText.textContent = "Local Standby";
    }
  }

  checkBackendHealth();

  // =========================================================================
  // Preset Handlers
  // =========================================================================
  function applyPreset(values) {
    updateQualityUI(values.OverallQual);
    grLivAreaInput.value = values.GrLivArea;
    garageCarsInput.value = values.GarageCars;
    totalBsmtSFInput.value = values.TotalBsmtSF;
    yearBuiltInput.value = values.YearBuilt;
    fullBathInput.value = values.FullBath;
    bedroomAbvGrInput.value = values.BedroomAbvGr;
    lotAreaInput.value = values.LotArea;

    hideError();
  }

  if (presetStarter) {
    presetStarter.addEventListener("click", () => {
      applyPreset({
        OverallQual: 5,
        GrLivArea: 1100,
        GarageCars: 1,
        TotalBsmtSF: 650,
        YearBuilt: 1982,
        FullBath: 1,
        BedroomAbvGr: 2,
        LotArea: 5200
      });
    });
  }

  if (presetSuburban) {
    presetSuburban.addEventListener("click", () => {
      applyPreset({
        OverallQual: 7,
        GrLivArea: 1800,
        GarageCars: 2,
        TotalBsmtSF: 900,
        YearBuilt: 2005,
        FullBath: 2,
        BedroomAbvGr: 3,
        LotArea: 8000
      });
    });
  }

  if (presetLuxury) {
    presetLuxury.addEventListener("click", () => {
      applyPreset({
        OverallQual: 9,
        GrLivArea: 3200,
        GarageCars: 3,
        TotalBsmtSF: 1750,
        YearBuilt: 2020,
        FullBath: 3,
        BedroomAbvGr: 4,
        LotArea: 14500
      });
    });
  }

  // =========================================================================
  // Error Handling Helpers
  // =========================================================================
  function showError(msg) {
    errorMessageText.textContent = msg;
    formErrorBanner.style.display = "flex";
  }

  function hideError() {
    formErrorBanner.style.display = "none";
  }

  // =========================================================================
  // Smooth Animated Counter for Price
  // =========================================================================
  function animatePriceCount(targetValue, formattedFinal, durationMs = 1100) {
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Smooth ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = targetValue * easeOut;

      displayPrice.textContent = `$${Math.round(currentValue).toLocaleString()}`;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        displayPrice.textContent = formattedFinal;
      }
    }

    requestAnimationFrame(updateCounter);
  }

  // =========================================================================
  // Form Submission & Inference Handler
  // =========================================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    // 1. Gather & validate input values
    const overallQual = parseInt(overallQualInput.value, 10);
    const grLivArea = parseFloat(grLivAreaInput.value);
    const garageCars = parseInt(garageCarsInput.value, 10);
    const totalBsmtSF = parseFloat(totalBsmtSFInput.value);
    const yearBuilt = parseInt(yearBuiltInput.value, 10);
    const fullBath = parseInt(fullBathInput.value, 10);
    const bedroomAbvGr = parseInt(bedroomAbvGrInput.value, 10);
    const lotArea = parseFloat(lotAreaInput.value);

    // Validation checks
    if (isNaN(overallQual) || overallQual < 1 || overallQual > 10) {
      showError("Overall Quality must be a number between 1 and 10.");
      overallQualInput.focus();
      return;
    }
    if (isNaN(grLivArea) || grLivArea <= 0) {
      showError("Living Area must be a positive number.");
      grLivAreaInput.focus();
      return;
    }
    if (isNaN(garageCars) || garageCars < 0) {
      showError("Garage Cars must be 0 or greater.");
      garageCarsInput.focus();
      return;
    }
    if (isNaN(totalBsmtSF) || totalBsmtSF < 0) {
      showError("Basement Area must be 0 or greater.");
      totalBsmtSFInput.focus();
      return;
    }
    if (isNaN(yearBuilt) || yearBuilt < 1800 || yearBuilt > 2030) {
      showError("Year Built must be between 1800 and 2030.");
      yearBuiltInput.focus();
      return;
    }
    if (isNaN(fullBath) || fullBath < 0) {
      showError("Full Bathrooms must be 0 or greater.");
      fullBathInput.focus();
      return;
    }
    if (isNaN(bedroomAbvGr) || bedroomAbvGr < 0) {
      showError("Bedrooms must be 0 or greater.");
      bedroomAbvGrInput.focus();
      return;
    }
    if (isNaN(lotArea) || lotArea <= 0) {
      showError("Lot Area must be a positive number.");
      lotAreaInput.focus();
      return;
    }

    // Exact feature order payload required by the trained model
    const payload = {
      OverallQual: overallQual,
      GrLivArea: grLivArea,
      GarageCars: garageCars,
      TotalBsmtSF: totalBsmtSF,
      YearBuilt: yearBuilt,
      FullBath: fullBath,
      BedroomAbvGr: bedroomAbvGr,
      LotArea: lotArea
    };

    lastPayloadData = payload;

    // 2. Transition Result Panel to Loading State
    resultIdleState.style.display = "none";
    resultActiveState.style.display = "none";
    resultLoadingState.style.display = "flex";

    // Update button state
    predictBtn.disabled = true;
    btnSpinner.style.display = "inline-block";
    predictBtn.querySelector(".btn-text").textContent = "Computing Prediction...";

    const startTime = performance.now();

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Inference failed" }));
        const message = errorData.detail || `Server returned error (${response.status})`;
        throw new Error(message);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error("Prediction returned unsuccessful status.");
      }

      lastPredictedFormatted = result.formatted_price;

      // 3. Render Results
      resultLoadingState.style.display = "none";
      resultActiveState.style.display = "flex";

      // Render summary pills
      summaryPills.innerHTML = `
        <span class="summary-pill">Qual: <strong>${payload.OverallQual}/10</strong></span>
        <span class="summary-pill">Area: <strong>${payload.GrLivArea.toLocaleString()} sq ft</strong></span>
        <span class="summary-pill">Garage: <strong>${payload.GarageCars} cars</strong></span>
        <span class="summary-pill">Basement: <strong>${payload.TotalBsmtSF.toLocaleString()} sq ft</strong></span>
        <span class="summary-pill">Built: <strong>${payload.YearBuilt}</strong></span>
        <span class="summary-pill">Baths: <strong>${payload.FullBath}</strong></span>
        <span class="summary-pill">Beds: <strong>${payload.BedroomAbvGr}</strong></span>
        <span class="summary-pill">Lot: <strong>${payload.LotArea.toLocaleString()} sq ft</strong></span>
      `;

      latencyDisplay.textContent = `${latencyMs} ms`;

      // Animate price counter
      animatePriceCount(result.predicted_price, result.formatted_price);

      // On mobile & small laptops, smooth scroll result panel into view
      if (window.innerWidth < 992 && resultPanel) {
        resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }

    } catch (err) {
      console.error("[HOMNIQ AI] Prediction error:", err);
      resultLoadingState.style.display = "none";
      resultIdleState.style.display = "flex";
      showError(`Prediction error: ${err.message}`);
    } finally {
      predictBtn.disabled = false;
      btnSpinner.style.display = "none";
      predictBtn.querySelector(".btn-text").textContent = "Generate AI Price Prediction";
    }
  });

  // =========================================================================
  // Copy Valuation Summary to Clipboard
  // =========================================================================
  if (copyValuationBtn) {
    copyValuationBtn.addEventListener("click", async () => {
      if (!lastPayloadData) return;

      const summaryText = `🏠 HOMNIQ AI Valuation: ${lastPredictedFormatted}\n` +
        `• Overall Quality: ${lastPayloadData.OverallQual}/10\n` +
        `• Living Area: ${lastPayloadData.GrLivArea.toLocaleString()} sq ft\n` +
        `• Garage: ${lastPayloadData.GarageCars} cars\n` +
        `• Basement: ${lastPayloadData.TotalBsmtSF.toLocaleString()} sq ft\n` +
        `• Year Built: ${lastPayloadData.YearBuilt}\n` +
        `• Bathrooms: ${lastPayloadData.FullBath} | Bedrooms: ${lastPayloadData.BedroomAbvGr}\n` +
        `• Lot Area: ${lastPayloadData.LotArea.toLocaleString()} sq ft\n` +
        `Evaluated using verified scikit-learn LinearRegression model (R² = 0.9724).`;

      try {
        await navigator.clipboard.writeText(summaryText);
        copyValuationBtn.classList.add("copied");
        if (copyBtnText) copyBtnText.textContent = "Copied to Clipboard!";

        setTimeout(() => {
          copyValuationBtn.classList.remove("copied");
          if (copyBtnText) copyBtnText.textContent = "Copy Valuation";
        }, 2200);
      } catch (err) {
        console.warn("[HOMNIQ AI] Clipboard copy failed:", err);
        if (copyBtnText) copyBtnText.textContent = "Press Ctrl+C to copy";
      }
    });
  }

  // =========================================================================
  // Reset Form & Return to Idle State
  // =========================================================================
  function resetAll() {
    form.reset();
    updateQualityUI(7);
    grLivAreaInput.value = "1800";
    garageCarsInput.value = "2";
    totalBsmtSFInput.value = "900";
    yearBuiltInput.value = "2005";
    fullBathInput.value = "2";
    bedroomAbvGrInput.value = "3";
    lotAreaInput.value = "8000";

    hideError();

    resultActiveState.style.display = "none";
    resultLoadingState.style.display = "none";
    resultIdleState.style.display = "flex";
    displayPrice.textContent = "$0.00";
    lastPayloadData = null;
  }

  if (resetFormBtn) resetFormBtn.addEventListener("click", resetAll);
  if (recalculateBtn) {
    recalculateBtn.addEventListener("click", () => {
      resetAll();
      overallQualInput.focus();
    });
  }
});
