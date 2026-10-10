/* WISPer site behavior. Plain JavaScript, no libraries.
   Each feature checks that its elements exist, so one file serves all four pages. */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Every page: current year in the footer ---------- */
  document.querySelectorAll(".year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- FAQ: opening one question closes the others ---------- */
  document.querySelectorAll(".faq").forEach(function (faq) {
    var items = faq.querySelectorAll("details");
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  });

  /* ---------- Home: the How it works video autoplays muted, unless motion is reduced ---------- */
  var howVideo = document.getElementById("how-video");

  if (howVideo && reduceMotion) {
    howVideo.removeAttribute("autoplay");
    howVideo.pause();
  }

  /* ---------- Home: the hero document types out example firm names ---------- */
  var firmName = document.getElementById("firm-name");

  if (firmName && !reduceMotion) {
    var firms = [
      "Whitfield & Associates, CPAs",
      "Desert Ridge Tax",
      "Harbor Lane Bookkeeping",
      "Mesa Verde Tax Group"
    ];
    var firmIndex = 0;

    function typeFirm(text, i) {
      firmName.textContent = text.slice(0, i);
      if (i < text.length) {
        setTimeout(function () { typeFirm(text, i + 1); }, 55);
      } else {
        setTimeout(eraseFirm, 2600);
      }
    }

    function eraseFirm() {
      var current = firmName.textContent;
      if (current.length > 0) {
        firmName.textContent = current.slice(0, -1);
        setTimeout(eraseFirm, 25);
      } else {
        firmIndex = (firmIndex + 1) % firms.length;
        setTimeout(function () { typeFirm(firms[firmIndex], 1); }, 300);
      }
    }

    setTimeout(eraseFirm, 3000);
  }

  /* ---------- Home: contact form checks ---------- */
  var form = document.getElementById("contact-form");

  if (form) {
    var status = form.querySelector(".form-status");
    var fields = form.querySelectorAll("input, textarea");
    var comments = document.getElementById("comments");
    var count = document.getElementById("comments-count");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var messages = {
      company: "Enter your company or organization name.",
      name: "Enter your name so we know who to address.",
      email: "Enter an email address we can reply to, like name@yourfirm.com.",
      comments: "Tell us what you would like to know (at least 10 characters)."
    };

    function isValid(field) {
      var value = field.value.trim();
      if (field.name === "email") return emailPattern.test(value);
      if (field.name === "comments") return value.length >= 10;
      return value.length > 0;
    }

    function showError(field, show) {
      var id = field.id + "-error";
      var error = document.getElementById(id);
      if (!error) {
        error = document.createElement("p");
        error.className = "error";
        error.id = id;
        field.insertAdjacentElement("afterend", error);
      }
      error.textContent = show ? messages[field.name] : "";
      field.setAttribute("aria-invalid", show ? "true" : "false");
      if (show) {
        field.setAttribute("aria-describedby", id);
      } else {
        field.removeAttribute("aria-describedby");
      }
    }

    function check(field) {
      var ok = isValid(field);
      showError(field, !ok);
      return ok;
    }

    fields.forEach(function (field) {
      // Check a field once the visitor leaves it, then live while they fix it
      field.addEventListener("blur", function () {
        if (field.value.trim() !== "") check(field);
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") check(field);
      });
    });

    if (comments && count) {
      comments.addEventListener("input", function () {
        count.textContent = comments.value.length + " / " + comments.maxLength;
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstBad = null;

      fields.forEach(function (field) {
        if (!check(field) && !firstBad) firstBad = field;
      });

      if (firstBad) {
        status.className = "form-status bad";
        status.textContent = "Please fix the highlighted fields and try again.";
        firstBad.focus();
        return;
      }

      var first = form.elements.name.value.trim().split(/\s+/)[0];
      var email = form.elements.email.value.trim();
      status.className = "form-status ok";
      status.textContent = "Thanks, " + first + ". Your message was received, and we will reply to " + email + " within one business day.";
      form.reset();
      if (count) count.textContent = "0 / " + comments.maxLength;
    });
  }

  /* ---------- Contents: section list jumps to that section in the sample ---------- */
  var sampleScroll = document.getElementById("sample-scroll");

  if (sampleScroll) {
    document.querySelectorAll("[data-section]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var target = document.getElementById(link.getAttribute("data-section"));
        if (!target) return;
        event.preventDefault();

        document.getElementById("sample").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        sampleScroll.scrollTop = target.offsetTop - sampleScroll.offsetTop - 16;

        sampleScroll.querySelectorAll(".is-active").forEach(function (el) {
          el.classList.remove("is-active");
        });
        target.classList.add("is-active");
      });
    });
  }

  /* ---------- Legal: show only the requirements a section meets ---------- */
  var filter = document.getElementById("section-filter");

  if (filter) {
    var rows = document.querySelectorAll("#rules tbody tr");
    var filterCount = document.getElementById("filter-count");

    function applyFilter() {
      var wanted = filter.value;
      var shown = 0;
      rows.forEach(function (row) {
        var match = wanted === "all" || row.getAttribute("data-sections").split(" ").indexOf(wanted) !== -1;
        row.hidden = !match;
        if (match) shown++;
      });
      filterCount.textContent = shown + " of " + rows.length + " requirements";
    }

    filter.addEventListener("change", applyFilter);
    applyFilter();
  }

  /* ---------- Pricing: total cost over a number of years ---------- */
  var years = document.getElementById("years");

  if (years) {
    var INITIAL = 400;
    var YEARLY = 100;

    function money(n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    }

    function updateCost() {
      var n = Number(years.value);
      var renewals = n - 1;
      var total = INITIAL + renewals * YEARLY;
      var label = n + (n === 1 ? " year" : " years");

      document.getElementById("years-out").textContent = label;
      document.getElementById("renewals").textContent = renewals;
      document.getElementById("renewal-cost").textContent = money(renewals * YEARLY);
      document.getElementById("total-cost").textContent = money(total);
      document.getElementById("avg-cost").textContent = money(total / n);
      years.setAttribute("aria-valuetext", label + ", total " + money(total));
    }

    years.addEventListener("input", updateCost);
    updateCost();
  }
});
