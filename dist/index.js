(() => {
  // shopConfig.js
  var urlParams = new URLSearchParams(window.location.search);
  var discountValue = urlParams.get("discount_value");
  var discountType = urlParams.get("discount_type");
  window.SHOP_CONFIG = [
    {
      productId: "4695416602690",
      domElId: "shop-section-1",
      galleryId: "shop-section-gallery-1"
    }
  ];
  window.STOREFRONT_API_KEY = "32ec18da35149dcec235531b328003b5";
  window.STOREFRONT_SHOP_URL = "https://blendjet.myshopify.com";
  window.CURRENCY = "$";
  window.STOREFRONT_GRAPHQL_URL = `${window.STOREFRONT_SHOP_URL}/api/2023-07/graphql.json`;
  window.STOREFRONT_HEADER = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Shopify-Storefront-Access-Token": window.STOREFRONT_API_KEY
  };
  window.PRODUCTS_DATA = null;
  window.GLOBAL_DISCOUNT = discountValue && discountType ? {
    value: discountValue,
    type: discountType
  } : null;

  // shopLogic.js
  var productIdsToFetch = window.SHOP_CONFIG.map(function(item) {
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
        body: JSON.stringify({ query: SHOP_STOREFRONT_QUERY_PRODUCTS })
      });
      if (!response.ok) {
        var message = `An error has occured: ${response.status}`;
        throw new Error(message);
      }
      response.json().then(function(data) {
        console.log(data);
        if (data?.data?.nodes) {
          var products = data?.data?.nodes;
          shopSectionRender(products);
        }
      });
    } catch (e) {
      console.log(e, "error", "fetchProduct");
    }
    console.log(SHOP_PRODUCTS_DATA);
  }
  function shopSectionRender(products) {
    window.SHOP_CONFIG.forEach(function(config) {
      var product = products.find(function(product2) {
        return String(removePrefixFromId(product2.id)) === String(config.productId);
      });
      var domEl = document.getElementById(config.domElId);
      var domGalleryEl = document.getElementById(config.galleryId);
      if (domEl) {
        if (!!product?.options) {
          var elShopOptions = domEl.querySelector(".shop-custom-options");
          var selectedVariant = product.variants.nodes.find(function(item) {
            return item.availableForSale;
          });
          SHOP_PRODUCTS_DATA.push(product);
          var swatchPng = selectedVariant.metafields?.find(function(m) {
            return m && m.key === "swatch_png";
          });
          var swatchColor = selectedVariant.metafields?.find(function(c) {
            return c.key === "swatch_color";
          });
          var elTitleSwatch = document.createElement("div");
          elTitleSwatch.classList.add("shop-custom-option__title-swatch");
          product.options.forEach(function(option) {
            var elOption = document.createElement("div");
            var elTitle = document.createElement("p");
            var elTitleValue = document.createElement("span");
            var elValues = document.createElement("div");
            var elCloseValues = document.createElement("span");
            var elChange = document.createElement("span");
            elCloseValues.classList.add("shop-custom-option__values-close");
            elCloseValues.textContent = "X";
            elChange.classList.add("shop-custom-option__change");
            elChange.textContent = "change ";
            const svgElement = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg"
            );
            svgElement.setAttribute("width", "15");
            svgElement.setAttribute("height", "14");
            svgElement.setAttribute("viewBox", "0 0 15 14");
            svgElement.setAttribute("fill", "none");
            const circleElement = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "circle"
            );
            circleElement.setAttribute("cx", "7.5");
            circleElement.setAttribute("cy", "7");
            circleElement.setAttribute("r", "7");
            circleElement.setAttribute("transform", "rotate(-180 7.5 7)");
            circleElement.setAttribute("fill", "#2D2C78");
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
            elValues.classList.add("shop-custom-option__values");
            elTitle.innerHTML = `${option.name}: &nbsp;`;
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
            option.values.forEach(function(value2, index) {
              var elValue = document.createElement("button");
              elValue.classList.add("shop-custom-option__value");
              elValue.title = value2;
              elValue.dataset.id = value2;
              var item = product.variants.nodes[index];
              if (item && item.availableForSale === false) {
                elValue.classList.add("oos");
              }
              if (!!selectedVariant?.selectedOptions?.length) {
                var currentValue = selectedVariant.selectedOptions.find(function(item2) {
                  return item2.value === value2 && item2.name === option.name;
                });
                if (currentValue) {
                  elValue.classList.add("active");
                  elShopOptions.dataset[option.name.toLowerCase()] = value2;
                  elTitleValue.innerHTML = currentValue.value;
                }
              } else {
                if (index === 0) {
                  elValue.classList.add("active");
                  elShopOptions.dataset[option.name.toLowerCase()] = value2;
                }
              }
              if (option.name === "Color" || option.name === "Colour") {
                var variant = product.variants.nodes.find(function(v) {
                  return v.title.includes(value2);
                });
                var swatchPng2 = variant.metafields?.find(function(m) {
                  return m && m.key === "swatch_png";
                });
                var swatchColor2 = variant.metafields?.find(function(c) {
                  return c.key === "swatch_color";
                });
                if (swatchPng2) {
                  elValue.innerHTML = elShopImage(
                    swatchPng2.reference.image.originalSrc,
                    value2,
                    32,
                    32
                  );
                } else if (swatchColor2) {
                  elValue.innerHTML = `<div style="background-color: ${swatchColor2.value}; height:32px; width:32px;"></div>`;
                } else {
                  elValue.innerHTML = value2;
                }
              } else {
                elValue.innerHTML = value2;
              }
              elTitle.addEventListener("click", function() {
                var optionParent = elTitle.closest(".shop-custom-option");
                optionParent.classList.add("active");
                var body = document.querySelector("body");
                body.style.overflow = "hidden";
              });
              elCloseValues.addEventListener("click", function() {
                var optionParent = elCloseValues.closest(".shop-custom-option");
                optionParent.classList.remove("active");
                var body = document.querySelector("body");
                body.style.overflow = "unset";
              });
              elValue.onclick = function(e) {
                e.target.parentNode.querySelectorAll(".shop-custom-option__value").forEach(function(item2) {
                  item2.classList.remove("active");
                });
                e.target.classList.add("active");
                elShopOptions.dataset[option.name.toLowerCase()] = value2;
                currentVariantHandler(product, domEl);
                var optionParent = elValue.closest(".shop-custom-option");
                optionParent.classList.remove("active");
                var body = document.querySelector("body");
                body.style.overflow = "unset";
                var elTitleValue2 = e.target.closest(".shop-custom-option")?.querySelector(".shop-custom-option__title-value");
                if (elTitleValue2) {
                  elTitleValue2.innerHTML = e.target.dataset.id;
                }
                if (swatchPng2 || swatchColor2) {
                  elTitleSwatch.innerHTML = elValue.innerHTML;
                }
              };
              elValues.appendChild(elValue);
              elValues.appendChild(elCloseValues);
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
        }
      }
    });
  }
  function currentVariantHandler(product, el) {
    var arrOptions = product.options.map(function(option) {
      return el.querySelector(
        ".shop-custom-options"
      ).dataset[option.name.toLowerCase()];
    });
    var currentVariant = product.variants.nodes.find(function(variant) {
      var arrSelectedOptions = variant.selectedOptions.map(function(item) {
        return item.value;
      });
      return areArraysEqual(arrOptions, arrSelectedOptions);
    });
    var domGalleryEl = document.querySelector(".shop-gallery");
    if (domGalleryEl) {
      var hasColor = currentVariant.selectedOptions.find(function(option) {
        var name = option.name;
        return name === "Color" || name === "Colour";
      });
      if (hasColor) {
        domGalleryEl.innerHTML = elShopImage(
          currentVariant?.image?.src,
          currentVariant?.image?.altText || currentVariant.title,
          300,
          300
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
      el.querySelector(".shop-custom-submit__price").innerHTML = `${window.CURRENCY}${prices.toFixed(2)}`;
      el.querySelector(".shop-custom-submit__price-compare").innerHTML = `${window.CURRENCY}${pricesCompare.toFixed(2)}`;
      elPlus.disabled = false;
      elMinus.disabled = false;
    } else {
      el.querySelector(".shop-custom").classList.add("oos");
      btnSubmit.dataset.productId = "";
      elPlus.disabled = true;
      elMinus.disabled = true;
    }
  }
  document.querySelectorAll(".shop-custom-quantity__plus").forEach(function(btn) {
    btn.addEventListener("click", function() {
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
      elPrice.innerHTML = `${window.CURRENCY}${((variant.priceDiscount ? +variant.priceDiscount : +variant.price) * +finalValue).toFixed(2)}`;
      elPriceDiscount.innerHTML = variant.priceDiscount ? `${window.CURRENCY}${(variant.price * +finalValue).toFixed(2)}` : "";
      if (minusEl.disabled) {
        minusEl.disabled = false;
      }
    });
  });
  document.querySelectorAll(".shop-custom-quantity__minus").forEach(function(btn) {
    btn.addEventListener("click", function() {
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
        finalValue = "1";
      }
      valueEl.innerHTML = finalValue;
      btnSubmit.dataset.productQuantity = finalValue;
      elPrice.innerHTML = `${window.CURRENCY}${((variant.priceDiscount ? +variant.priceDiscount : +variant.price) * +finalValue).toFixed(2)}`;
      elPriceDiscount.innerHTML = variant.priceDiscount ? `${window.CURRENCY}${(variant.price * +finalValue).toFixed(2)}` : "";
      if (+finalValue === 1) {
        this.disabled = true;
      }
    });
  });
  function areArraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
      return false;
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
      ...window.PRODUCTS_DATA || [],
      ...product.variants.nodes.map(function(variant) {
        return {
          id: removePrefixFromId(variant.id),
          title: variant.title,
          titleProduct: product.title,
          idProduct: removePrefixFromId(product.id),
          image: getImage(variant),
          price: variant.compareAtPrice?.amount ? (+variant.compareAtPrice?.amount).toFixed(2) : (+variant.price?.amount).toFixed(2),
          priceDiscount: variant.compareAtPrice?.amount ? (+variant.price?.amount).toFixed(2) : "",
          quantity: "0"
        };
      })
    ];
  }
  function removePrefixFromId(id) {
    var prefixes = {
      variant: "gid://shopify/ProductVariant/",
      option: "gid://shopify/ProductOption/",
      product: "gid://shopify/Product/"
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
  function elShopImage(src, alt, width, height) {
    return `
          <img src="${src}" alt="${alt}" title="${alt}" width="${width}" height="${height}" loading="lazy">
       `;
  }
  function getVariantById(id) {
    return window.PRODUCTS_DATA.find(function(variant) {
      return String(id) === String(variant.id);
    });
  }

  // cartSlideout.js
  var LOCAL_STORAGE_CART_DATA = window.location.href + "_LP_CART_DATA";
  var classCartTrigger = ".js-cart-trigger";
  var classCartTriggerCount = ".js-cart-trigger-count";
  var classShopWrapper = ".js-shop";
  var classAtcButton = ".js-atc-button";
  var cartItem = {
    name: "cart-item",
    props: ["item", "currency"],
    methods: {
      increase() {
        this.$emit("increase", this.item.id);
      },
      decrease() {
        this.$emit("decrease", this.item.id);
      },
      remove() {
        this.$emit("remove", this.item.id);
      }
    }
  };
  var vm = new Vue({
    el: "#cart-drawer",
    components: {
      "cart-item": cartItem
    },
    data() {
      return {
        STOREFRONT_SHOP_URL: window.STOREFRONT_SHOP_URL,
        CURRENCY: window.CURRENCY || "$",
        productsData: null,
        isCartDrawerVisible: false,
        isLoading: false,
        cartData: [],
        totalPrice: 0,
        discountPrice: 0,
        cartDataLength: 0
      };
    },
    computed: {
      isCartEmpty() {
        return this.cartData && !this.cartData.length;
      }
    },
    methods: {
      fetchProductData() {
        if (window && window.PRODUCTS_DATA) {
          this.productsData = window.PRODUCTS_DATA;
        } else {
          console.error("CART SLIDE-OUT ERROR - There is no var PRODUCTS_DATA");
        }
      },
      fetchCartData() {
        var localStorageData = localStorage.getItem(LOCAL_STORAGE_CART_DATA);
        if (localStorageData) {
          this.cartData = JSON.parse(localStorageData).items;
          this.calcTotalPrice();
        }
      },
      cartVisible() {
        this.isCartDrawerVisible = true;
        document.querySelector("body").style.overflow = "hidden";
      },
      cartHidden() {
        this.isCartDrawerVisible = false;
        document.querySelector("body").style.overflow = "unset";
      },
      cartItemQuantityIncrease(id) {
        var elementPos = this.cartData.map(function(x) {
          return +x.id;
        }).indexOf(+id);
        var objectFound = this.cartData[elementPos];
        var _cartData = [...this.cartData];
        _cartData[elementPos].quantity = +objectFound.quantity + 1;
        this.cartData = _cartData;
      },
      cartItemQuantityDecrease(id) {
        var elementPos = this.cartData.map(function(x) {
          return +x.id;
        }).indexOf(+id);
        var objectFound = this.cartData[elementPos];
        var _cartData = [...this.cartData];
        var quantity = +objectFound.quantity;
        if (quantity > 1) {
          _cartData[elementPos].quantity = +objectFound.quantity - 1;
          this.cartData = _cartData;
        } else {
          this.cartData = _cartData.filter(function(item) {
            return +item.id !== +id;
          });
        }
      },
      cartItemRemove(id) {
        this.cartData = this.cartData.filter(function(item) {
          return +item.id !== +id;
        });
      },
      calcTotalPrice() {
        this.totalPrice = this.cartData.reduce(function(total, item) {
          var price = item.priceDiscount ? item.priceDiscount : item.price;
          return +price * item.quantity + +total;
        }, 0).toFixed(2);
        var prices = [];
        this.cartData.map(function(item) {
          var price = +item.priceDiscount || item.price;
          for (let i = 1; i <= +item.quantity; i++) {
            prices.push(+price);
          }
        });
      },
      domToggleCartDrawer() {
        var cartTrigger = document.querySelector(classCartTrigger);
        if (cartTrigger) {
          document.querySelector(classCartTrigger).addEventListener(
            "click",
            function() {
              this.cartVisible();
            }.bind(this)
          );
        }
      },
      domAddToCart() {
        var atcButtonElementAll = document.querySelectorAll(classAtcButton);
        if (atcButtonElementAll && !!atcButtonElementAll.length) {
          atcButtonElementAll.forEach(
            function(atcButton) {
              atcButton.addEventListener(
                "click",
                function() {
                  var productId = atcButton.dataset && atcButton.dataset.productId;
                  var productQuantity = atcButton.dataset && atcButton.dataset.productQuantity;
                  if (productId && productQuantity && this.productsData && !!this.productsData.length) {
                    var isProductInCart = this.cartData.find(function(item) {
                      return +item.id === +productId;
                    });
                    if (isProductInCart) {
                      var elementPos = this.cartData.map(function(x) {
                        return +x.id;
                      }).indexOf(+productId);
                      var objectFound = this.cartData[elementPos];
                      var _cartData = [...this.cartData];
                      _cartData[elementPos].quantity = +objectFound.quantity + +productQuantity;
                      this.cartData = _cartData;
                    } else {
                      var productData = this.productsData.find(function(item) {
                        return +item.id === +productId;
                      });
                      if (productData && productData.id) {
                        this.cartData.unshift({
                          ...productData,
                          quantity: productQuantity
                        });
                      }
                    }
                    this.cartVisible();
                  }
                }.bind(this)
              );
            }.bind(this)
          );
        }
      },
      domUpdateCartItems() {
        var cartItemsLength = !!this.cartData.length ? this.cartData.reduce(function(total, item) {
          return +item.quantity + +total;
        }, 0) : "0";
        var countElement = document.querySelector(classCartTriggerCount);
        if (countElement) {
          countElement.innerHTML = cartItemsLength;
        }
        this.cartDataLength = cartItemsLength;
      },
      smoothScroll() {
        var shopWrapperElement = document.querySelector(classShopWrapper);
        if (shopWrapperElement) {
          shopWrapperElement.scrollIntoView({
            behavior: "smooth"
          });
          this.cartHidden();
        }
      },
      onCheckout() {
        var productUrlParams = "";
        this.cartData.map(
          function(item, index) {
            productUrlParams = productUrlParams + item.id + ":" + item.quantity + (index + 1 < this.cartData.length ? "," : "");
          }.bind(this)
        );
        var finalUrl = STOREFRONT_SHOP_URL + "/cart/" + productUrlParams;
        if (productUrlParams) {
          this.isLoading = true;
          window.location.assign(finalUrl);
        }
      },
      cartUpsellHandler(data) {
        var cartUpsellEl = document.getElementById("cart-upsell");
        var cartUpsellWrapper = document.querySelector(".cart-upsell__wrapper");
        var cartUpsellItemsEl = cartUpsellEl.querySelectorAll(".upsell-item");
        var cartUpsellTitle = cartUpsellWrapper.querySelector(
          ".cart-upsell__title"
        );
        if (cartUpsellEl && cartUpsellItemsEl) {
          cartUpsellItemsEl.forEach(function(item) {
            var elProductId = item.dataset.upsellProductId;
            var findUpsellItemInData = data.some(function(el) {
              return +el.idProduct === +elProductId;
            });
            if (findUpsellItemInData) {
              item.classList.add("display-article");
            } else {
              item.classList.remove("display-article");
            }
          });
          var isUpsellSectionVisible = [...cartUpsellItemsEl].some(function(item) {
            return !item.classList.contains("display-article");
          });
          cartUpsellEl.style.display = isUpsellSectionVisible ? "block" : "none";
          cartUpsellTitle.style.display = isUpsellSectionVisible ? "block" : "none";
        }
      }
    },
    watch: {
      cartData(data) {
        localStorage.setItem(
          LOCAL_STORAGE_CART_DATA,
          JSON.stringify({
            items: data
          })
        );
        this.domUpdateCartItems();
        this.calcTotalPrice();
        this.cartUpsellHandler(data);
      }
    },
    mounted() {
      var that = this;
      var limitedInterval = setInterval(function() {
        if (window.PRODUCTS_DATA) {
          clearInterval(limitedInterval);
          that.fetchProductData();
          that.fetchCartData();
          that.domToggleCartDrawer();
          that.domAddToCart();
          that.domUpdateCartItems();
        }
      }, 1e3);
    }
  });
})();
//# sourceMappingURL=index.js.map
