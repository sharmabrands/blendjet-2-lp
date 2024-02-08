var UPSELL_CONFIG = {
  UPSELL_PRODUCT_HANDLE: "jetpack-smoothies",
  UPDATE_IMAGE_ON_VARIANT_CHANGE: true,
  SHOP_SECTION_UPSELL_DIV_ID: "shop-upsell",
  CART_SECTION_UPSELL_DIV_ID: "cart-upsell",
  ADD_TO_CART_TEXT: "ADD",
  OUT_OF_STOCK_TEXT: "OUT OF STOCK",
};
var UPSELL_STOREFRONT_QUERY_UPSELL = `
    productByHandle(handle: ${UPSELL_PRODUCT_HANDLE}) {
      title
      priceRangeV2 {
        maxVariantPrice {
          amount
        }
      }
      variants(first: 1) {
              edges {
                node {
                  id
                  title
                }
              }
            }
      images(first: 1) {
        edges {
          node {
            url
            altText
          }
        }
      }
    }
  `;
var UPSELL_DATA = null;

fetchUpsellData();

async function fetchUpsellData() {
  try {
    var response = await fetch(STOREFRONT_GRAPHQL_URL, {
      headers: STOREFRONT_HEADER,
      method: "POST",
      body: JSON.stringify({ query: UPSELL_STOREFRONT_QUERY_UPSELL }),
    });
    var responseJson = await response.json();
    
    var data = responseJson?.data?.collectionByHandle?.products?.edges;
    console.log("UPSELL-DATA", data);
    if (!!data?.length) {
      var variantsProductsData = [];
      var dataFiltered = data.map(function ({ node }) {
        var noOptions =
          !node.options.length ||
          (node.options.length === 1 && node.options[0].name === "Title");
        var variantsUpsell = [];
        node.variants?.nodes.map(function (variant) {
          var id = removePrefixFromId(variant.id);
          var idProduct = removePrefixFromId(node.id);
          var price = variant.compareAtPrice?.amount
            ? (+variant.compareAtPrice?.amount).toFixed(2)
            : (+variant.price?.amount).toFixed(2);
          var priceCompare = variant.compareAtPrice?.amount
            ? (+variant.price?.amount).toFixed(2)
            : "";
          var title = variant.title;
          var titleProduct = node.title;
          var image = variant.image?.src;

          variantsUpsell.push({
            ...variant,
            id,
            idProduct,
            title,
            titleProduct,
            price: priceCompare ? priceCompare : price,
            compareAtPrice: priceCompare ? price : "",
            image,
            selectedOptions: noOptions ? null : variant.selectedOptions,
            optionId: noOptions
              ? null
              : variant.selectedOptions
                  .map(function (option) {
                    return option.value;
                  })
                  .join(","),
          });

          if (variant.availableForSale) {
            var optSelFormat = variant.selectedOptions.map(function (opt) {
              return {
                [opt.name.toLowerCase()]: opt.value,
              };
            });
            variantsProductsData.push(
              Object.assign(
                {},
                {
                  id,
                  idProduct,
                  title,
                  titleProduct,
                  price,
                  isUpsell: true,
                  priceDiscount: priceCompare,
                  selectedOptions: variant.selectedOptions,
                  image,
                  quantity: "0",
                },
                ...optSelFormat
              )
            );
          }
        });

        return {
          id: removePrefixFromId(node.id),
          title: node.title,
          titleProduct: node.title,
          options: noOptions
            ? null
            : node.options.map(function (option) {
                return {
                  ...option,
                  id: removePrefixFromId(option.id),
                };
              }),
          variants: variantsUpsell,
        };
      });

      render(dataFiltered);
      UPSELL_DATA = dataFiltered;
      window.PRODUCTS_DATA = [
        ...(window.PRODUCTS_DATA || []),
        ...variantsProductsData,
      ];
    }
  } catch (e) {
    console.log(e, "upsell");
  }
}

function render(data) {
  data.forEach(function (item) {
    if (UPSELL_CONFIG.SHOP_SECTION_UPSELL_DIV_ID) {
      document
        .getElementById(UPSELL_CONFIG.SHOP_SECTION_UPSELL_DIV_ID)
        .insertAdjacentHTML("beforeend", createUpsellItem(item));
    }
    if (UPSELL_CONFIG.CART_SECTION_UPSELL_DIV_ID) {
      document
        .getElementById(UPSELL_CONFIG.CART_SECTION_UPSELL_DIV_ID)
        .insertAdjacentHTML("beforeend", createUpsellItem(item));
    }
  });

  onOptionChangeHandler();
}

function createUpsellItem(item) {
  var firstAvailableVariant = item.variants.find(function (variant) {
    return variant.availableForSale;
  });

  if (!firstAvailableVariant) return "";

  return `
<article
class="upsell-item"
data-upsell-product-id="${item.id}"
${renderDataAttr(item.options, firstAvailableVariant)}
>
<figure class="upsell-item__media">
  <img
    src="${firstAvailableVariant.image}"
    alt="${firstAvailableVariant.title}"
    title="${firstAvailableVariant.title}"
    width="100"
    height="100"
    class="upsell-item__image"
    loading="lazy"
  >
</figure>
<div class="upsell-item__content">
  <div class="upsell-item__reviews">
    <div class="upsell-item__stars">${renderStars()}</div>
    <span class="upsell-item__text">5-Star Reviews</span>
  </div>
  <h3 class="upsell-item__title">${item.title}</h3>
  ${renderSelects(item.options, firstAvailableVariant)}
  <footer class="upsell-item__footer">
    <div class="upsell-item__quantity">
      <button class="upsell-item__quantity-btn upsell-item__quantity-minus" disabled onclick="decrease(event)">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="14" fill="#F6F5FD"/>
      <path d="M6 14H22" stroke="#373895" stroke-width="1.5"/>
      </svg>
      
      </button>
      <span class="upsell-item__quantity-value">1</span>
      <button class="upsell-item__quantity-btn upsell-item__quantity-plus" onclick="increase(event)">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="28" height="28" rx="14" fill="#F6F5FD"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.25 14.75V22H14.75V14.75H22V13.25H14.75V6H13.25V13.25H6V14.75H13.25Z" fill="#373895"/>
</svg>
      
      </button>
    </div>
    <button
      class="upsell-item__cta js-atc-button"
      data-product-id="${firstAvailableVariant.id}"
      data-product-quantity="1"
    >
      <span class="upsell-item__cta-text">${
        UPSELL_CONFIG.ADD_TO_CART_TEXT
      }</span> - <del class="upsell-item__price-compare" style="display: ${
    +firstAvailableVariant.compareAtPrice &&
    +firstAvailableVariant.compareAtPrice > +firstAvailableVariant.price
      ? "inline"
      : "none"
  }" >${CURRENCY}${
    +firstAvailableVariant.compareAtPrice
      ? (+firstAvailableVariant.compareAtPrice).toFixed(2)
      : ""
  }</del> <span class="upsell-item__price">${CURRENCY}${(+firstAvailableVariant.price).toFixed(
    2
  )}</span>
    </button>
  </footer>
</div>
</article>
`;
}

function onOptionChangeHandler() {
  document
    .querySelectorAll(".upsell-item__option-select")
    .forEach(function (item) {
      item.addEventListener("change", function (e) {
        var upsellItem = e.target.closest(".upsell-item");
        var elPrice = upsellItem.querySelector(".upsell-item__price");
        var elPriceCompare = upsellItem.querySelector(
          ".upsell-item__price-compare"
        );
        upsellItem.dataset[e.target.name.toLowerCase()] = e.target.value;
        var upsellItemOptionId = "";
        var ctaButton = upsellItem.querySelector(".upsell-item__cta");
        var ctaButtonText = upsellItem.querySelector(".upsell-item__cta-text");

        var upsellItemId = upsellItem.dataset.upsellProductId;
        var product = UPSELL_DATA.find(function (p) {
          return +p.id === +upsellItemId;
        });
        for (let i = 0; i < product.options.length; i++) {
          upsellItemOptionId += `${
            upsellItem.dataset[product.options[i].name.toLowerCase()]
          }${i + 1 === product.options.length ? "" : ","}`;
        }
        var variant = product.variants.find(function (v) {
          return v.optionId === upsellItemOptionId;
        });

        upsellItem.querySelector(".upsell-item__cta").dataset.productId =
          variant.id;
        elPrice.innerHTML = `${CURRENCY}${(+variant.price).toFixed(2)}`;
        if (variant.compareAtPrice) {
          elPriceCompare.innerHTML = `${CURRENCY}${(+variant.compareAtPrice).toFixed(
            2
          )}`;
          elPriceCompare.style.display = "inline";
        } else {
          elPriceCompare.innerHTML = "";
          elPriceCompare.style.display = "none";
        }
        if (UPSELL_CONFIG.UPDATE_IMAGE_ON_VARIANT_CHANGE) {
          var img = upsellItem.querySelector(".upsell-item__image");
          if (img) {
            img.src = variant.image;
            img.title = variant.title;
            img.alt = variant.title;
          }
        }
        if (!variant.availableForSale) {
          ctaButton.disabled = true;
          ctaButtonText.innerHTML = UPSELL_CONFIG.OUT_OF_STOCK_TEXT;
        } else {
          ctaButton.disabled = false;
          ctaButtonText.innerHTML = UPSELL_CONFIG.ADD_TO_CART_TEXT;
        }
      });
    });
}

function renderSelects(options, firstAvailableVariant) {
  if (!options || !options.length) return "";

  var selects = [];

  options.forEach(function (select) {
    if (!!select.values.length) {
      selects.push(`
  <div class="upsell-item__option">
    <label class="upsell-item__option-label" for="${select.name}">${
        select.name
      }: </label>
    <select
      name="${select.name}"
      id="${select.id}"
      class="upsell-item__option-select"
    >${renderOptions(select, firstAvailableVariant)}</select>
  </div>
`);
    }
  });

  return `<div class="upsell-item__options">${selects.join("")}</div>`;
}

function renderOptions(select, firstAvailableVariant) {
  if (!select.values.length) return "";

  var options = [];

  select.values.forEach(function (option) {
    const currentVariantOption = firstAvailableVariant.selectedOptions.find(
      function (item) {
        return item.value === option;
      }
    );
    options.push(`
<option
  id="${option}"
  class="upsell-item__option-option"
  value="${option}"
  ${currentVariantOption ? "selected" : ""}
>${option}</option>
`);
  });

  return options.join("");
}

function renderDataAttr(options, firstAvailableVariant) {
  if (!options || !options.length) return "";

  var attrs = [];

  options.forEach(function (select) {
    const currentVariantOption = firstAvailableVariant.selectedOptions.find(
      function (item) {
        return item.name === select.name;
      }
    );
    attrs.push(`
data-${select.name.toLowerCase()}="${currentVariantOption.value}"
`);
  });

  return attrs.join("");
}

function decrease(e) {
  var upsellItem = e.target.closest(".upsell-item");
  if (upsellItem) {
    var quantityValue = upsellItem.querySelector(
      ".upsell-item__quantity-value"
    );
    var buttonAtc = upsellItem.querySelector(".upsell-item__cta");
    var newValue = +quantityValue.innerHTML - 1;

    if (quantityValue) {
      quantityValue.innerHTML = `${newValue}`;
    }

    if (buttonAtc) {
      buttonAtc.dataset.productQuantity = `${newValue}`;
    }

    if (+newValue === 1) {
      e.target.disabled = true;
    }
  }
}

function increase(e) {
  var upsellItem = e.target.closest(".upsell-item");
  if (upsellItem) {
    var quantityMinus = upsellItem.querySelector(
      ".upsell-item__quantity-minus"
    );
    var quantityValue = upsellItem.querySelector(
      ".upsell-item__quantity-value"
    );
    var buttonAtc = upsellItem.querySelector(".upsell-item__cta");
    var newValue = +quantityValue.innerHTML + 1;

    if (quantityValue) {
      quantityValue.innerHTML = `${newValue}`;
    }

    if (buttonAtc) {
      buttonAtc.dataset.productQuantity = `${newValue}`;
    }

    if (quantityMinus.disabled) {
      quantityMinus.disabled = false;
    }
  }
}

function renderStars(stars = 5) {
  var star = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2281_84)">
<path d="M7.99998 1.12L10.2016 5.37439L15.0912 6.184L11.6384 9.58399L12.3872 14.4848L8.00638 12.1936L3.65918 14.4496L4.44638 9.60159L0.937576 6.1552L5.85278 5.44479L7.99998 1.12Z" fill="#FFC51F" stroke="#FFC51F" stroke-width="1.12" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_2281_84">
<rect width="16" height="16" fill="white"/>
</clipPath>
</defs>
</svg>
`;

  var _stars = [];
  for (let i = 0; i < stars; i++) {
    _stars.push(star);
  }

  return `${_stars.join("")}`;
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
