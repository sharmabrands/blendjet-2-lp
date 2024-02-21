const parentDiv = document.querySelector(".shop-custom");
const startSticky = document.querySelector(".js-shop-wrapper");
const pdp = document.querySelector(".blendjet-pdp");
const footer = document.querySelector(".blendjet-footer");
const atcText = document.querySelector(".atc-text");
const shopSticky = document.querySelector(".shop-custom-sticky");

const colorTitle = document.querySelector(".shop-custom-option__title");
//const colorTitleText = colorTitle.innerText;
const colorValue = document.querySelector(".shop-custom-option__title-value");

if (parentDiv) {
  var PAST_PDP = "scrolled-past";

  window.addEventListener("scroll", function () {
    if (
      isInViewport(startSticky) ||
      isInViewport(pdp) ||
      isInViewport(footer)
    ) {
      if (parentDiv.classList.contains(PAST_PDP)) {
        shopSticky.style.opacity = "1";
        parentDiv.classList.remove(PAST_PDP);
        atcText.innerText = "ADD TO CART - ";

        if (window.innerWidth <= 568) {
            colorTitle.innerText = "COLOR: &nbsp;";
            colorValue.style.display = "block";
        }
      }
    } else {
      if (!parentDiv.classList.contains(PAST_PDP)) {
        shopSticky.style.opacity = "1";
        parentDiv.classList.add(PAST_PDP);
        atcText.innerText = "ADD - ";

        if (window.innerWidth <= 568) {
            colorTitle.innerText = "";
            colorValue.style.display = "none";
        }
      }
    }
  });

  function isInViewport(elem) {
    var rect = elem.getBoundingClientRect();

    return (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}
