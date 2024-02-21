var productIdsToFetch = window.SHOP_CONFIG.map(function (item) {
  return `"gid://shopify/Product/${item.productId}"`;
});
var SHOP_STOREFRONT_QUERY_PRODUCTS = `{
      nodes(ids: [${productIdsToFetch.join(",")}]) {
        ... on Product {
             id
             title
             options {
                 id
                 name
                 values
             }
             images(first: 200) {
                 edges {
                     node {
                         originalSrc
                         altText
                     }
                 }
             }
             variants(first: 200) {
                 nodes {
                     title
                     id
                     selectedOptions {
                         name
                         value
                     }
                     product {
                        id
                        title
                     }
                     price { amount }
                     compareAtPrice { amount }
                     availableForSale
                     quantityAvailable
                     image {
                         src
						 altText
                     }
                     metafields(identifiers: [ 
                    {namespace: "custom", key: "swatch_color"}, 
                    {namespace: "custom", key: "swatch_png"}, 
                    ]) { 
                        value
                        key
                        namespace
                        id
                        reference {
                            ... on MediaImage {
                            image {
                                originalSrc
                            }
                        }
                    }
                    }
                 }
             }
        }
      }
    }`;
var SHOP_PRODUCTS_DATA = [];

fetchProduct();

async function fetchProduct() {
  try {
    var response = await fetch(STOREFRONT_GRAPHQL_URL, {
      headers: STOREFRONT_HEADER,
      method: "POST",
      body: JSON.stringify({ query: SHOP_STOREFRONT_QUERY_PRODUCTS }),
    });
    if (!response.ok) {
      var message = `An error has occured: ${response.status}`;
      throw new Error(message);
    }

    response.json().then(function (data) {
      if (data?.data?.nodes) {
        var products = data?.data?.nodes;
        var mainProduct = [],
          upsellProduct = [];
        mainProduct.push(products[0]);
        upsellProduct.push(products[1]);
        shopSectionRender(mainProduct);
        upsellSectionRender(upsellProduct);
      }
    });
  } catch (e) {
    console.log(e, "error", "fetchProduct");
  }
}

function upsellSectionRender(products) {
  const config = window.SHOP_CONFIG[1];
  var product = products.find(function (product) {
    return String(removePrefixFromId(product.id)) === String(config.productId);
  });

  var upsellItem = document.getElementById(config.upsellItemId);
  var upsellItemTitle = document.getElementById(config.upsellItemTitleId);
  var upsellItemPrice = document.getElementById(config.upsellItemPriceId);
  var upsellItemQuantity = document.getElementById(config.upsellItemQuantityId);
  var upsellBtnSubmit = document.getElementById(config.upsellItemSubmitId);
  var upsellBtnPlus = document.getElementById(config.upsellItemPlusId);
  var upsellBtnMinus = document.getElementById(config.upsellItemMinusId);

  if (window.innerWidth < 480) {
    upsellItem = document.getElementById(`${config.upsellItemId}-mobile`);
    upsellItemTitle = document.getElementById(
      `${config.upsellItemTitleId}-mobile`
    );
    upsellItemPrice = document.getElementById(
      `${config.upsellItemPriceId}-mobile`
    );
    upsellItemQuantity = document.getElementById(
      `${config.upsellItemQuantityId}-mobile`
    );
    upsellBtnSubmit = document.getElementById(
      `${config.upsellItemSubmitId}-mobile`
    );
    upsellBtnPlus = document.getElementById(
      `${config.upsellItemPlusId}-mobile`
    );
    upsellBtnMinus = document.getElementById(
      `${config.upsellItemMinusId}-mobile`
    );
  }
  if (upsellItem) {
    const bananaBlueberry = product.variants.nodes.find(function (variant) {
      return variant.title === "Banana Blueberry";
    });

    var variantId = removePrefixFromId(bananaBlueberry.id);

    upsellItem.innerHTML = elShopImage(
      bananaBlueberry.image.src,
      bananaBlueberry.title,
      window.innerWidth < 480 ? 80 : 120,
      window.innerWidth < 480 ? 80 : 120
    );

    upsellItemTitle.innerText = bananaBlueberry.title + " Smoothie";

    upsellItemPrice.innerHTML = `${window.CURRENCY}${bananaBlueberry.price.amount}`;

    populateProductsDataGlobal(product);

    upsellBtnSubmit.dataset.productId = variantId;
    upsellBtnSubmit.dataset.productQuantity = "1";

    upsellBtnPlus.addEventListener("click", function () {
      var finalValue = String(+upsellItemQuantity.innerHTML + 1);
      if (finalValue <= bananaBlueberry?.quantityAvailable) {
        upsellItemQuantity.innerHTML = finalValue;
        upsellBtnSubmit.dataset.productQuantity = finalValue;
        upsellItemPrice.innerHTML = `${window.CURRENCY}${(
          +bananaBlueberry.price.amount * +finalValue
        ).toFixed(2)}`;
      }
    });

    upsellBtnMinus.addEventListener("click", function () {
      var finalValue = String(+upsellItemQuantity.innerHTML - 1);
      if (finalValue > 0) {
        upsellItemQuantity.innerHTML = finalValue;
        upsellBtnSubmit.dataset.productQuantity = finalValue;
        upsellItemPrice.innerHTML = `${window.CURRENCY}${(
          +bananaBlueberry.price.amount * +finalValue
        ).toFixed(2)}`;
      }
    });
  }
}

function shopSectionRender(products) {
  window.SHOP_CONFIG.forEach(function (config) {
    var product = products.find(function (product) {
      return (
        String(removePrefixFromId(product.id)) === String(config.productId)
      );
    });
    var domEl = document.getElementById(config.domElId);
    var domGalleryEl = document.getElementById(config.galleryId);

    if (domEl) {
      if (!!product?.options) {
        var elShopOptions = domEl.querySelector(".shop-custom-options");
        var selectedVariant = product.variants.nodes.find(function (item) {
          return item.availableForSale;
        });

        SHOP_PRODUCTS_DATA.push(product);
        var swatchPng = selectedVariant.metafields?.find(function (m) {
          return m && m.key === "swatch_png";
        });
        var swatchColor = selectedVariant.metafields?.find(function (c) {
          return c.key === "swatch_color";
        });
        var elTitleSwatch = document.createElement("div");
        elTitleSwatch.classList.add("shop-custom-option__title-swatch");

        product.options.forEach(function (option) {
          var elOption = document.createElement("div");
          var elTitle = document.createElement("p");
          var elTitleLabel = document.createElement("span");
          var elTitleValue = document.createElement("span");
          var elValues = document.createElement("div");
          var elCloseValues = document.createElement("span");
          var elChange = document.createElement("span");
          elCloseValues.classList.add("shop-custom-option__values-close");
          elCloseValues.textContent = "X";
          elChange.classList.add("shop-custom-option__change");
          elChange.textContent = "change ";
          // Create the <svg> element
          const svgElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );
          svgElement.setAttribute("width", "15");
          svgElement.setAttribute("height", "14");
          svgElement.setAttribute("viewBox", "0 0 15 14");
          svgElement.setAttribute("fill", "none");

          // Create the <circle> element inside the <svg>
          const circleElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          circleElement.setAttribute("cx", "7.5");
          circleElement.setAttribute("cy", "7");
          circleElement.setAttribute("r", "7");
          circleElement.setAttribute("transform", "rotate(-180 7.5 7)");
          circleElement.setAttribute("fill", "#2D2C78");

          // Create the <path> element inside the <svg>
          const pathElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          pathElement.setAttribute(
            "d",
            "M10.3003 5.59999L7.50029 8.39999L4.70029 5.59999"
          );
          pathElement.setAttribute("stroke", "#F6F5FD");
          pathElement.setAttribute("stroke-width", "1.4");
          svgElement.appendChild(circleElement);
          svgElement.appendChild(pathElement);
          elChange.appendChild(svgElement);

          elOption.classList.add("shop-custom-option");
          elOption.classList.add(option.name.toLowerCase());
          elTitle.classList.add("shop-custom-option__title");
          elTitleValue.classList.add("shop-custom-option__title-value");
          elTitleLabel.classList.add("shop-custom-option__title-label");
          elValues.classList.add("shop-custom-option__values");
          elTitleLabel.innerHTML = `${option.name}: &nbsp;`;
          if (swatchPng) {
            elTitleSwatch.innerHTML = elShopImage(
              swatchPng.reference.image.originalSrc,
              value,
              32,
              32
            );
          }
          if (swatchColor) {
            elTitleSwatch.innerHTML = `<span style="background-color: ${swatchColor.value}; height:32px; width:32px;"></span>`;
          }

          option.values.forEach(function (value, index) {
            var elValue = document.createElement("button");
            elValue.classList.add("shop-custom-option__value");
            elValue.title = value;
            elValue.dataset.id = value;
            var item = product.variants.nodes[index]; // Assuming there's a corresponding item for each value

            if (item && item.availableForSale === false) {
              elValue.classList.add("oos");
            }
            if (!!selectedVariant?.selectedOptions?.length) {
              var currentValue = selectedVariant.selectedOptions.find(function (
                item
              ) {
                return item.value === value && item.name === option.name;
              });

              if (currentValue) {
                elValue.classList.add("active");
                elShopOptions.dataset[option.name.toLowerCase()] = value;
                elTitleValue.innerHTML = currentValue.value;
              }
            } else {
              if (index === 0) {
                elValue.classList.add("active");
                elShopOptions.dataset[option.name.toLowerCase()] = value;
              }
            }

            if (option.name === "Color" || option.name === "Colour") {
              var variant = product.variants.nodes.find(function (v) {
                return v.title.includes(value);
              });
              var swatchPng = variant.metafields?.find(function (m) {
                return m && m.key === "swatch_png";
              });

              var swatchColor = variant.metafields?.find(function (c) {
                return c.key === "swatch_color";
              });

              if (swatchPng) {
                elValue.innerHTML = elShopImage(
                  swatchPng.reference.image.originalSrc,
                  value,
                  32,
                  32
                );
              } else if (swatchColor) {
                elValue.innerHTML = `<div style="background-color: ${swatchColor.value}; height:32px; width:32px;"></div>`;
              } else {
                elValue.innerHTML = value;
              }
            } else {
              elValue.innerHTML = value;
            }
            document.onclick = function (e) {
              var optionParent = elCloseValues.closest(".shop-custom-option");
              if (
                (window.innerWidth > 767 &&
                  !e.target.classList.contains("shop-custom-option__values") &&
                  !e.target.classList.contains("shop-custom-option__value") &&
                  !e.target.classList.contains("shop-custom-option__title")) ||
                (window.innerWidth <= 767 &&
                  optionParent.classList.contains("active") &&
                  e.target.classList.contains("shop-custom-option__title"))
              ) {
                optionParent.classList.remove("active");
                var body = document.querySelector("body");
                body.style.overflow = "unset";
              }

              //   else if (optionParent.classList.contains("active")) {
              //     optionParent.classList.remove("active");
              //     var body = document.querySelector("body");
              //     body.style.overflow = "unset";
              //   }
            };
            elTitle.addEventListener("click", function () {
              if (
                document.querySelector(".shop-custom") &&
                document
                  .querySelector(".shop-custom")
                  .classList.contains("scrolled-past")
              ) {
                var optionParent = elTitle.closest(".shop-custom-option");
                optionParent.classList.add("active");
                var body = document.querySelector("body");
                body.style.overflow = "hidden";
              }
            });
            elCloseValues.addEventListener("click", function () {
              var optionParent = elCloseValues.closest(".shop-custom-option");
              optionParent.classList.remove("active");
              var body = document.querySelector("body");
              body.style.overflow = "unset";
            });
            elValue.onclick = function (e) {
              //Switch slider back to pdp image
              const videoSlide = document.querySelector(".slide-1");
              const descSlide = document.querySelector(".slide-2");
              const pdpSlide = document.querySelector(".slide-3");
              const leftArrowBtn = document.querySelector(
                ".w-slider-arrow-left"
              );
              const rightArrowBtn = document.querySelector(
                ".w-slider-arrow-right"
              );

              if (pdpSlide.hasAttribute("aria-hidden")) {
                if (videoSlide.hasAttribute("aria-hidden")) {
                  rightArrowBtn.click();
                } else if (descSlide.hasAttribute("aria-hidden")) {
                  leftArrowBtn.click();
                }
              }

              e.target.parentNode
                .querySelectorAll(".shop-custom-option__value")
                .forEach(function (item) {
                  item.classList.remove("active");
                });
              e.target.classList.add("active");
              elShopOptions.dataset[option.name.toLowerCase()] = value;
              currentVariantHandler(product, domEl);
              var optionParent = elValue.closest(".shop-custom-option");
              optionParent.classList.remove("active");
              var body = document.querySelector("body");
              body.style.overflow = "unset";
              // Update option title
              var elTitleValue = document.querySelector(
                ".shop-custom-option__title-value"
              );

              if (elTitleValue) {
                elTitleValue.innerHTML = e.target.dataset.id;
              }

              if (swatchPng || swatchColor) {
                elTitleSwatch.innerHTML = elValue.innerHTML;
              }
            };

            elValues.appendChild(elValue);
            elValues.appendChild(elCloseValues);
            elTitle.appendChild(elTitleLabel);
            elTitle.appendChild(elTitleSwatch);
          });

          elTitle.appendChild(elTitleValue);
          elTitle.appendChild(elChange);
          elOption.appendChild(elTitle);
          elOption.appendChild(elValues);

          elShopOptions.appendChild(elOption);
        });
        currentVariantHandler(product, domEl);
        populateProductsDataGlobal(product);

        // if ( domGalleryEl ) {
        // 	var hasColor = selectedVariant.selectedOptions.find( function ( option ) {
        // 		var name = option.name;
        // 		return name === 'Color' || name === 'Colour';
        // 	} );

        // 	if ( hasColor ) {
        // 		domGalleryEl.innerHTML = elShopImage( selectedVariant?.image?.src, selectedVariant?.image?.altText || selectedVariant.title, 300, );
        // 	}
        // }
      }
    }
  });
}

function currentVariantHandler(product, el) {
  var arrOptions = product.options.map(function (option) {
    return el.querySelector(
      ".shop-custom-options"
    ).dataset[option.name.toLowerCase()];
  });

  var currentVariant = product.variants.nodes.find(function (variant) {
    var arrSelectedOptions = variant.selectedOptions.map(function (item) {
      return item.value;
    });

    return areArraysEqual(arrOptions, arrSelectedOptions);
  });

  var domGalleryEl = document.querySelector(".shop-gallery");
  if (domGalleryEl) {
    var hasColor = currentVariant.selectedOptions.find(function (option) {
      var name = option.name;
      return name === "Color" || name === "Colour";
    });

    if (hasColor) {
      domGalleryEl.innerHTML = elShopImage(
        currentVariant?.image?.src,
        currentVariant?.image?.altText || currentVariant.title,
        478,
        478
      );
    }
  }

  var elPlus = el.querySelector(".shop-custom-quantity__plus");
  var elMinus = el.querySelector(".shop-custom-quantity__minus");
  var btnSubmit = el.querySelector(".shop-custom-submit");
  var prices = +currentVariant?.price?.amount;
  var pricesCompare = +currentVariant?.compareAtPrice?.amount;
  var valueEl = el.querySelector(".shop-custom-quantity__value");
  if (currentVariant && currentVariant.availableForSale) {
    btnSubmit.dataset.productId = removePrefixFromId(currentVariant.id);
    el.querySelector(".shop-custom").classList.remove("oos");
    el.querySelector(".shop-custom-submit__price").innerHTML = `${
      window.CURRENCY
    }${prices.toFixed(2)}`;
    el.querySelector(".shop-custom-submit__price-compare").innerHTML = `${
      window.CURRENCY
    }${pricesCompare.toFixed(2)}`;
    document.querySelector(".afterpay-price").innerHTML = `${window.CURRENCY}${(
      (currentVariant?.price?.amount
        ? +currentVariant?.price?.amount
        : +currentVariant?.compareAtPrice?.amount) / 4
    ).toFixed(2)}`;
    elPlus.disabled = false;
    elMinus.disabled = false;
  } else {
    el.querySelector(".shop-custom").classList.add("oos");
    btnSubmit.dataset.productId = "";
    elPlus.disabled = true;
    elMinus.disabled = true;
  }
}

document
  .querySelectorAll(".shop-custom-quantity__plus")
  .forEach(function (btn) {
    btn.addEventListener("click", function () {
      var elShop = btn.closest(".shop-custom");
      var valueEl = elShop.querySelector(".shop-custom-quantity__value");
      var minusEl = elShop.querySelector(".shop-custom-quantity__minus");
      var btnSubmit = elShop.querySelector(".shop-custom-submit");
      var elPrice = elShop.querySelector(".shop-custom-submit__price");
      var elPriceDiscount = elShop.querySelector(
        ".shop-custom-submit__price-compare"
      );
      var finalValue = String(+valueEl.innerHTML + 1);
      var variant = getVariantById(btnSubmit.dataset.productId);
      valueEl.innerHTML = finalValue;
      btnSubmit.dataset.productQuantity = finalValue;
      elPrice.innerHTML = `${window.CURRENCY}${(
        (variant.priceDiscount ? +variant.priceDiscount : +variant.price) *
        +finalValue
      ).toFixed(2)}`;
      elPriceDiscount.innerHTML = variant.priceDiscount
        ? `${window.CURRENCY}${(variant.price * +finalValue).toFixed(2)}`
        : "";
      if (minusEl.disabled) {
        minusEl.disabled = false;
      }
    });
  });
document
  .querySelectorAll(".shop-custom-quantity__minus")
  .forEach(function (btn) {
    btn.addEventListener("click", function () {
      var elShop = btn.closest(".shop-custom");
      var valueEl = elShop.querySelector(".shop-custom-quantity__value");
      var finalValue = String(+valueEl.innerHTML - 1);

      var btnSubmit = elShop.querySelector(".shop-custom-submit");
      var elPrice = elShop.querySelector(".shop-custom-submit__price");
      var elPriceDiscount = elShop.querySelector(
        ".shop-custom-submit__price-compare"
      );
      var variant = getVariantById(btnSubmit.dataset.productId);

      if (+finalValue < 1) {
        finalValue = "1"; // Ensure the value does not go below 1
      }

      valueEl.innerHTML = finalValue;
      btnSubmit.dataset.productQuantity = finalValue;

      elPrice.innerHTML = `${window.CURRENCY}${(
        (variant.priceDiscount ? +variant.priceDiscount : +variant.price) *
        +finalValue
      ).toFixed(2)}`;
      elPriceDiscount.innerHTML = variant.priceDiscount
        ? `${window.CURRENCY}${(variant.price * +finalValue).toFixed(2)}`
        : "";

      if (+finalValue === 1) {
        this.disabled = true;
      }
    });
  });

function areArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;

  var result = true;

  for (let i = 0; i < arr1.length; i++) {
    if (!arr2.includes(arr1[i])) {
      result = false;
      break;
    }
  }

  return result;
}

function populateProductsDataGlobal(product) {
  window.PRODUCTS_DATA = [
    ...(window.PRODUCTS_DATA || []),
    ...product.variants.nodes
      // .filter( function ( variant ) { return variant.availableForSale; } )
      .map(function (variant) {
        return {
          id: removePrefixFromId(variant.id),
          title: variant.title,
          titleProduct: product.title,
          idProduct: removePrefixFromId(product.id),
          image: getImage(variant),
          price: variant.compareAtPrice?.amount
            ? (+variant.compareAtPrice?.amount).toFixed(2)
            : (+variant.price?.amount).toFixed(2),
          priceDiscount: variant.compareAtPrice?.amount
            ? (+variant.price?.amount).toFixed(2)
            : "",
          quantity: "0",
        };
      }),
  ];
}

function removePrefixFromId(id) {
  var prefixes = {
    variant: "gid://shopify/ProductVariant/",
    option: "gid://shopify/ProductOption/",
    product: "gid://shopify/Product/",
  };

  if (id.includes(prefixes.variant)) {
    return id.replace(prefixes.variant, "");
  }

  if (id.includes(prefixes.option)) {
    return id.replace(prefixes.option, "");
  }

  if (id.includes(prefixes.product)) {
    return id.replace(prefixes.product, "");
  }

  return id;
}

function getImage(variant) {
  if (variant && variant.image && variant.image.src) {
    return variant.image.src;
  } else {
    return SHOP_PRODUCTS_DATA.images.edges[0].node.src;
  }
}

// function updateAfterPay( el, price, quantity ) {
// 	var elAfterPayPrice = el.querySelector( '.shop-custom-footer__afterpay span' );

// 	if ( elAfterPayPrice && price && quantity ) {
// 		elAfterPayPrice.innerHTML = `${ window.CURRENCY }${ ( (+price * +quantity) / 4 ).toFixed( 2 ) }`;
// 	}
// }

function elShopImage(src, alt, width, height) {
  return `
          <img src="${src}" alt="${alt}" title="${alt}" width="${width}" height="${height}" loading="lazy">
       `;
}

function elShopGallery(images, elId) {
  if (!images.length) return "";

  return `
          <div class="swiper ${elId}-mySwiper2">
             <div class="swiper-wrapper">
             ${images
               .map(function (img) {
                 return `<div class="swiper-slide">${elShopImage(
                   img.src,
                   img.alt,
                   530,
                   530
                 )}</div>`;
               })
               .join("")}
             </div>
          </div>
          <div class="swiper ${elId}-mySwiper">
             <div class="swiper-wrapper">
                ${images
                  .map(function (img) {
                    return `<div class="swiper-slide">${elShopImage(
                      img.src,
                      img.alt,
                      75,
                      75
                    )}</div>`;
                  })
                  .join("")}
             </div>
          </div>
       `;
}

function swiperSliderInit(elId) {
  var swiper = new Swiper(`.${elId}-mySwiper`, {
    loop: true,
    spaceBetween: 10,
    slidesPerView: 6,
    freeMode: true,
    watchSlidesProgress: true,
    lazy: {
      loadPrevNext: true,
    },
  });
  var swiper2 = new Swiper(`.${elId}-mySwiper2`, {
    loop: true,
    spaceBetween: 0,
    thumbs: {
      swiper: swiper,
    },
    lazy: {
      loadPrevNext: true,
    },
  });
}

function getVariantById(id) {
  return window.PRODUCTS_DATA.find(function (variant) {
    return String(id) === String(variant.id);
  });
}

window.onload = function () {
  // Changing See All Colors to See Less and vice versa
  const seeMoreBtn = document.querySelector(".shop-custom-see-more");
  const seeMoreTextBlock = seeMoreBtn.querySelector(".see-more-text");
  const origSwatchHeight = document.querySelector(
    ".shop-custom-options"
  ).offsetHeight;

  seeMoreBtn.onclick = function () {
    const expandText = "See All Colors";
    const shrinkText = "See Less";

    setTimeout(() => {
      const newSwatchHeight = document.querySelector(
        ".shop-custom-options"
      ).offsetHeight;
      var heightDiff;

      if (seeMoreTextBlock.innerText === expandText) {
        seeMoreTextBlock.innerText = shrinkText;
        heightDiff = Math.abs(origSwatchHeight - newSwatchHeight);
        if (window.innerWidth <= 767 && window.innerWidth >= 480) {
          window.scrollTo({
            top: 370 + heightDiff,
            left: 0,
            behavior: "smooth",
          });
        } else if (window.innerWidth < 480) {
          window.scrollTo({
            top: 320 + heightDiff,
            left: 0,
            behavior: "smooth",
          });
        } else {
          window.scrollTo({
            top: 120 + heightDiff,
            left: 0,
            behavior: "smooth",
          });
        }
      } else {
        seeMoreTextBlock.innerText = expandText;
        if (window.innerWidth <= 991) {
          window.scrollTo({
            top: 530,
            left: 0,
            behavior: "smooth",
          });
        } else {
          window.scrollTo({
            top: 280,
            left: 0,
            behavior: "smooth",
          });
        }
      }
    }, 300);
  };

  // Stop Slider Scroll at the end of PDP section
  if (window.innerWidth > 991) {
    const fixedElement = document.querySelector(".shop-gallery-row");

    fixedElement.style.top = "0rem";
    fixedElement.style.position = "absolute";
    fixedElement.style.display = "flex";

    document.addEventListener("scroll", function () {
      var pdpSectionHeight =
        document.querySelector(".pdp-section").offsetHeight;
      var stopScrollingAt = pdpSectionHeight - 650;
      if (window.scrollY >= stopScrollingAt) {
        fixedElement.style.top = `${pdpSectionHeight - 650}px`;
        fixedElement.style.position = "absolute";
      } else {
        fixedElement.style.top = "9rem";
        fixedElement.style.position = "fixed";
      }
    });
  }
  //TODO: IF VIEWPORT HAS Y VALUE BETWEEN X AND Y -> INNER-TEXT IS BLANK
  //      ELSE INNER-TEXT IS ORIGINAL;
};
