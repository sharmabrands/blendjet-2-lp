import Vue from "vue/dist/vue.js";

var LOCAL_STORAGE_CART_DATA = window.location.href + "_LP_CART_DATA";
var classCartTrigger = ".js-cart-trigger";
var classCartTriggerCount = ".js-cart-trigger-count";
var classShopWrapper = ".js-shop";
var classAtcButton = ".js-atc-button";
var classAtcUpsellButton = ".js-atc-button-upsell";
var classAtcUpsellButtonMobile = ".js-atc-button-upsell-mobile";
var classProductQuantity = ".shop-custom-quantity__value";
var classProductUpsellQuantity = "shop-custom-quantity__value-upsell";
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
    },
  },
};

var vm = new Vue({
  el: "#cart-drawer",
  components: {
    "cart-item": cartItem,
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
      cartDataLength: 0,
    };
  },
  computed: {
    isCartEmpty() {
      return this.cartData && !this.cartData.length;
    },
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
      if (
        document.querySelector(".shop-custom") &&
        document
          .querySelector(".shop-custom")
          .classList.contains("scrolled-past")
      ) {
        document.querySelector(".shop-custom").style.opacity = "0";
      }
    },
    cartHidden() {
      this.isCartDrawerVisible = false;
      document.querySelector("body").style.overflow = "unset";

      if (
        document.querySelector(".shop-custom") &&
        document
          .querySelector(".shop-custom")
          .classList.contains("scrolled-past")
      ) {
        document.querySelector(".shop-custom").style.opacity = "1";
      }
    },
    cartItemQuantityIncrease(id) {
      var elementPos = this.cartData
        .map(function (x) {
          return +x.id;
        })
        .indexOf(+id);
      var objectFound = this.cartData[elementPos];
      var _cartData = [...this.cartData];
      _cartData[elementPos].quantity = +objectFound.quantity + 1;
      this.cartData = _cartData;
    },
    cartItemQuantityDecrease(id) {
      var elementPos = this.cartData
        .map(function (x) {
          return +x.id;
        })
        .indexOf(+id);
      var objectFound = this.cartData[elementPos];
      var _cartData = [...this.cartData];
      var quantity = +objectFound.quantity;
      if (quantity > 1) {
        _cartData[elementPos].quantity = +objectFound.quantity - 1;
        this.cartData = _cartData;
      } else {
        this.cartData = _cartData.filter(function (item) {
          return +item.id !== +id;
        });
      }
    },
    cartItemRemove(id) {
      this.cartData = this.cartData.filter(function (item) {
        return +item.id !== +id;
      });
    },
    calcTotalPrice() {
      this.totalPrice = this.cartData
        .reduce(function (total, item) {
          var price = item.priceDiscount ? item.priceDiscount : item.price;
          return +price * item.quantity + +total;
        }, 0)
        .toFixed(2);

      var prices = [];
      this.cartData.map(function (item) {
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
          function () {
            this.cartVisible();
          }.bind(this)
        );
      }
    },
    domAddToCartMain() {
      var atcButton = document.querySelector(classAtcButton);
      atcButton.addEventListener(
        "click",
        function () {
          var productId = atcButton.dataset && atcButton.dataset.productId;
          var productQuantity =
            (atcButton.dataset && atcButton.dataset.productQuantity) ||
            document.querySelector(classProductQuantity).innerHTML;
          if (
            productId &&
            productQuantity &&
            this.productsData &&
            !!this.productsData.length
          ) {
            var isProductInCart = this.cartData.find(function (item) {
              return +item.id === +productId;
            });

            if (isProductInCart) {
              var elementPos = this.cartData
                .map(function (x) {
                  return +x.id;
                })
                .indexOf(+productId);
              var objectFound = this.cartData[elementPos];
              var _cartData = [...this.cartData];
              _cartData[elementPos].quantity =
                +objectFound.quantity + +productQuantity;
              this.cartData = _cartData;
            } else {
              var productData = this.productsData.find(function (item) {
                return +item.id === +productId;
              });

              if (productData && productData.id) {
                this.cartData.unshift({
                  ...productData,
                  quantity: productQuantity,
                });
              }
            }
            this.cartVisible();
          }
        }.bind(this)
      );
    },
    domAddToCartUpsell() {
      var atcButtonUpsell =
        window.innerWidth < 480
          ? document.querySelector(classAtcUpsellButtonMobile)
          : document.querySelector(classAtcUpsellButton);
      atcButtonUpsell.addEventListener(
        "click",
        function () {
          var productId =
            atcButtonUpsell.dataset && atcButtonUpsell.dataset.productId;
          var productQuantity =
            (atcButtonUpsell.dataset &&
              atcButtonUpsell.dataset.productQuantity) ||
            document.querySelector(classProductUpsellQuantity).innerHTML;
          if (
            productId &&
            productQuantity &&
            this.productsData &&
            !!this.productsData.length
          ) {
            var isProductInCart = this.cartData.find(function (item) {
              return +item.id === +productId;
            });

            if (isProductInCart) {
              var elementPos = this.cartData
                .map(function (x) {
                  return +x.id;
                })
                .indexOf(+productId);
              var objectFound = this.cartData[elementPos];
              var _cartData = [...this.cartData];
              _cartData[elementPos].quantity =
                +objectFound.quantity + +productQuantity;
              this.cartData = _cartData;
            } else {
              var productData = this.productsData.find(function (item) {
                return +item.id === +productId;
              });

              if (productData && productData.id) {
                this.cartData.unshift({
                  ...productData,
                  quantity: productQuantity,
                });
              }
            }
            this.cartVisible();
          }
        }.bind(this)
      );
    },
    domUpdateCartItems() {
      var cartItemsLength = !!this.cartData.length
        ? this.cartData.reduce(function (total, item) {
            return +item.quantity + +total;
          }, 0)
        : "0";
      var countElement = document.querySelector(classCartTriggerCount);
      if (countElement) {
        countElement.innerHTML = cartItemsLength;
      }
      if (countElement.innerHTML === "0") {
        countElement.style.display = "none";
      } else {
        countElement.style.display = "flex";
      }

      this.cartDataLength = cartItemsLength;
    },
    smoothScroll() {
      var shopWrapperElement = document.querySelector(classShopWrapper);
      if (shopWrapperElement) {
        shopWrapperElement.scrollIntoView({
          behavior: "smooth",
        });
        this.cartHidden();
      }
    },
    onCheckout() {
      var productUrlParams = "";
      this.cartData.map(
        function (item, index) {
          productUrlParams =
            productUrlParams +
            item.id +
            ":" +
            item.quantity +
            (index + 1 < this.cartData.length ? "," : "");
        }.bind(this)
      );
      var finalUrl = STOREFRONT_SHOP_URL + "/cart/" + productUrlParams;

      if (productUrlParams) {
        this.isLoading = true;
        window.location.assign(finalUrl);
      }
    },
    // cartUpsellHandler(data) {
    //   var cartUpsellEl = document.getElementById("cart-upsell");
    //   var cartUpsellWrapper = document.querySelector(".cart-upsell__wrapper");
    //   var cartUpsellItemsEl = cartUpsellEl.querySelectorAll(".upsell-item");
    //   var cartUpsellTitle = cartUpsellWrapper.querySelector(
    //     ".cart-upsell__title"
    //   );

    //   if (cartUpsellEl && cartUpsellItemsEl) {
    //     cartUpsellItemsEl.forEach(function (item) {
    //       var elProductId = item.dataset.upsellProductId;
    //       var findUpsellItemInData = data.some(function (el) {
    //         return +el.idProduct === +elProductId;
    //       });

    //       if (findUpsellItemInData) {
    //         item.classList.add("display-article");
    //       } else {
    //         item.classList.remove("display-article");
    //       }
    //     });
    //     var isUpsellSectionVisible = [...cartUpsellItemsEl].some(function (
    //       item
    //     ) {
    //       return !item.classList.contains("display-article");
    //     });

    //     cartUpsellEl.style.display = isUpsellSectionVisible ? "block" : "none";
    //     cartUpsellTitle.style.display = isUpsellSectionVisible
    //       ? "block"
    //       : "none";
    //   }
    // },
  },
  watch: {
    cartData(data) {
      localStorage.setItem(
        LOCAL_STORAGE_CART_DATA,
        JSON.stringify({
          items: data,
        })
      );
      this.domUpdateCartItems();
      this.calcTotalPrice();
      //this.cartUpsellHandler(data);
    },
  },
  mounted() {
    var that = this;
    var limitedInterval = setInterval(function () {
      if (window.PRODUCTS_DATA) {
        clearInterval(limitedInterval);

        that.fetchProductData();
        that.fetchCartData();
        that.domToggleCartDrawer();
        that.domAddToCartMain();
        that.domAddToCartUpsell();
        that.domUpdateCartItems();
      }
    }, 1000);
  },
});
