import {
  COIN_PACK_DISCOUNT,
  DISCOUNT_CONFIG,
  PurchaseConfirmModal,
  QRCodeModal
} from "../chunk-D6RS7VVN.js";
import {
  FEATURES,
  MODEL_CATALOG,
  calculateModelUsageEquivalent,
  getModelConsumptionMeta
} from "../chunk-QV36S7MP.js";
import "../chunk-S6G7BNXH.js";
import {
  require_browser
} from "../chunk-DO6FUM4J.js";
import {
  xo,
  y
} from "../chunk-FIFMHOOJ.js";
import "../chunk-JFZWIPAT.js";
import {
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  DollarSign,
  ExternalLink,
  FileText,
  Gift,
  Mail,
  PartyPopper,
  Search,
  ShoppingCart,
  Sparkles,
  Wallet,
  X,
  Zap
} from "../chunk-JXWNLA5R.js";
import "../chunk-ZBN2L4XF.js";
import {
  FiCheck,
  FiShoppingCart,
  FiStar,
  FiX,
  FiZap,
  LegalConsentNotice,
  isAuthenticated,
  renderPage
} from "../chunk-QT2QMT3H.js";
import "../chunk-NAVX2E5L.js";
import {
  getTranslations
} from "../chunk-I75C2KRS.js";
import {
  require_react
} from "../chunk-O5BMCJM4.js";
import {
  __toESM
} from "../chunk-U67V476Y.js";

// frontend/pages/Pricing.jsx
var import_react27 = __toESM(require_react());

// frontend/components/pricing/PricingHeader.jsx
var import_react2 = __toESM(require_react());

// frontend/components/pricing/BalanceCouponBar.jsx
var import_react = __toESM(require_react(), 1);
function BalanceCouponBar({
  isAuthed,
  currentBalance,
  balanceLoading,
  useBalance,
  setUseBalance,
  appliedCoupon,
  clearCoupon,
  showCouponInput,
  couponCode,
  setCouponCode,
  couponLoading,
  applyCoupon,
  formatPrice: formatPrice3
}) {
  const t2 = getTranslations("pricing", {});
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "flex flex-col items-end space-y-2 w-full" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full" }, showCouponInput && /* @__PURE__ */ import_react.default.createElement("div", { className: "flex items-center gap-2 w-full" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "text",
      value: couponCode,
      onChange: (e) => setCouponCode(e.target.value.toUpperCase()),
      placeholder: useBalance ? t2.balance?.balanceEnabled || "\u5DF2\u542F\u7528\u4F59\u989D\u62B5\u6263" : t2.balance?.couponPlaceholder || "\u8F93\u5165\u4F18\u60E0\u5238\u7801",
      className: "term-input w-full pl-4 pr-12 py-2 text-sm placeholder-[#4f8b43] disabled:opacity-50 disabled:cursor-not-allowed",
      onKeyPress: (e) => {
        if (e.key === "Enter" && !useBalance) applyCoupon();
      },
      disabled: couponLoading || useBalance
    }
  ), /* @__PURE__ */ import_react.default.createElement("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3" }, useBalance ? /* @__PURE__ */ import_react.default.createElement("svg", { className: "w-4 h-4 text-[var(--term-primary)]", fill: "currentColor", viewBox: "0 0 20 20" }, /* @__PURE__ */ import_react.default.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" })) : /* @__PURE__ */ import_react.default.createElement("svg", { className: "w-4 h-4 text-[#5ea652]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" })))), /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      onClick: applyCoupon,
      disabled: couponLoading || !couponCode.trim() || useBalance,
      className: "term-btn-secondary px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
    },
    couponLoading ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" }), /* @__PURE__ */ import_react.default.createElement("span", null, t2.balance?.verifying || "\u9A8C\u8BC1\u4E2D")) : /* @__PURE__ */ import_react.default.createElement("span", null, t2.balance?.verify || "\u5E94\u7528")
  ))), showCouponInput && appliedCoupon && /* @__PURE__ */ import_react.default.createElement("div", { className: "flex items-center space-x-2 text-xs" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "flex items-center space-x-1 text-[var(--term-primary)]" }, /* @__PURE__ */ import_react.default.createElement(FiCheck, { className: "w-4 h-4" }), /* @__PURE__ */ import_react.default.createElement("span", null, appliedCoupon.message)), /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      onClick: clearCoupon,
      className: "text-[#5ea652] hover:text-[var(--term-primary)] transition-colors",
      title: "\u6E05\u9664\u4F18\u60E0\u5238"
    },
    /* @__PURE__ */ import_react.default.createElement("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20" }, /* @__PURE__ */ import_react.default.createElement("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }))
  )));
}

// frontend/components/pricing/PricingHeader.jsx
function PricingHeader(props) {
  const { topRightContent, ...barProps } = props;
  const t2 = getTranslations("pricing", {});
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "pricing-terminal-header mb-6" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 md:p-5" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex flex-col xl:flex-row justify-between items-start gap-4" }, /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h1", { className: "text-2xl md:text-3xl font-bold text-[var(--term-primary)] leading-tight tracking-wide" }, t2.header?.title || "\u5957\u9910\u4E0E\u5B9A\u4EF7", /* @__PURE__ */ import_react2.default.createElement("span", { className: "term-cursor" }, "_")), /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-sm text-[var(--term-text-soft)] mt-1" }, t2.header?.subtitle || "\u9009\u62E9\u9002\u5408\u60A8\u9700\u6C42\u7684\u65B9\u6848")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "w-full xl:w-auto xl:min-w-[560px] max-w-[560px] flex flex-col items-stretch gap-3 self-stretch xl:self-start" }, topRightContent, /* @__PURE__ */ import_react2.default.createElement(BalanceCouponBar, { ...barProps })))));
}

// frontend/components/pricing/PlanTabs.jsx
var import_react3 = __toESM(require_react());
function PlanTabs({ activeTab, onChange }) {
  const t2 = getTranslations("pricing", {});
  const tabs = [
    { id: "experience", label: t2.tabs?.experience || "\u4F53\u9A8C\u5361" },
    { id: "personal", label: t2.tabs?.personal || "\u4E2A\u4EBA\u5957\u9910" },
    { id: "enterprise", label: t2.tabs?.enterprise || "\u4F01\u4E1A\u5957\u9910" },
    { id: "flexible", label: t2.tabs?.flexible || "\u7075\u6D3B\u9009\u8D2D" }
  ];
  return /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex justify-center mb-10" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "inline-flex bg-black/5 p-1.5 rounded-2xl backdrop-blur-sm" }, tabs.map((tab) => /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      key: tab.id,
      onClick: () => onChange(tab.id),
      className: `
							px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
							${activeTab === tab.id ? "bg-white text-gray-900 shadow-md transform scale-105" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"}
						`
    },
    tab.label
  ))));
}

// frontend/components/pricing/ErrorAlert.jsx
var import_react4 = __toESM(require_react());
function ErrorAlert({ error, onEnterpriseClick, onPersonalClick }) {
  const t2 = getTranslations("pricing", {});
  if (!error) return null;
  const isEnterprisePack = (error || "").includes("\u4F01\u4E1A\u52A0\u6CB9\u5305");
  const isCoinPack = (error || "").includes("\u52A0\u6CB9\u5305") && !isEnterprisePack;
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "mb-6 bg-[#180909] border border-[var(--term-error)] p-4" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-start justify-between gap-3" }, /* @__PURE__ */ import_react4.default.createElement("p", { className: "text-[#ff8a8a] flex-1 text-sm" }, error), isEnterprisePack && /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      onClick: onEnterpriseClick,
      className: "flex-shrink-0 inline-flex items-center px-3 py-1.5 text-xs term-btn-secondary"
    },
    t2.error?.buyEnterprise || "\u53BB\u8D2D\u4E70\u4F01\u4E1A\u5957\u9910"
  ), isCoinPack && /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      onClick: onPersonalClick,
      className: "flex-shrink-0 inline-flex items-center px-3 py-1.5 text-xs term-btn-secondary"
    },
    t2.error?.buyMonthly || "\u53BB\u8D2D\u4E70\u6708\u5361"
  )));
}

// frontend/components/pricing/CouponBanner.jsx
var import_react5 = __toESM(require_react());
function CouponBanner({ appliedCoupon, originalPlans }) {
  const t2 = getTranslations("pricing", {});
  if (!appliedCoupon || originalPlans.length === 0) return null;
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "flex items-center justify-center space-x-2" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "p-2 bg-red-100 rounded-full" }, /* @__PURE__ */ import_react5.default.createElement("svg", { className: "w-5 h-5 text-red-600", fill: "currentColor", viewBox: "0 0 20 20" }, /* @__PURE__ */ import_react5.default.createElement("path", { fillRule: "evenodd", d: "M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z", clipRule: "evenodd" }))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "text-center" }, /* @__PURE__ */ import_react5.default.createElement("p", { className: "text-lg font-bold text-red-700 flex items-center justify-center gap-2" }, /* @__PURE__ */ import_react5.default.createElement(PartyPopper, { className: "w-5 h-5" }), " ", t2.couponBanner?.applied || "\u4F18\u60E0\u5238\u5DF2\u751F\u6548\uFF01\u4EAB\u53D7", " ", appliedCoupon.discount, t2.couponBanner?.discount || "% \u6298\u6263"), /* @__PURE__ */ import_react5.default.createElement("p", { className: "text-sm text-red-600" }, t2.couponBanner?.note || "\u6240\u6709\u6708\u5EA6\u5957\u9910\u4EF7\u683C\u5DF2\u81EA\u52A8\u5E94\u7528\u6298\u6263(\u5F53\u524D\u5B63\u5EA6\u548C\u5E74\u4ED8\u4E0D\u53C2\u4E0E)")))));
}

// frontend/components/pricing/PlanSections.jsx
var import_react12 = __toESM(require_react());

// frontend/components/pricing/PlanOptionCard.jsx
var import_react6 = __toESM(require_react());

// frontend/core/config/pricing.js
var personalPlansConfig = [
  {
    id: "claude_code_normal",
    name: "\u5C0F\u6708\u5361",
    description: "\u9002\u5408\u8F7B\u91CF\u7EA7\u5F00\u53D1, \u6027\u4EF7\u6BD4\u4E4B\u9009",
    period: "/\u6708",
    features: [
      "\u652F\u6301Claude 4.5 Opus & Sonnet 4.5\u7B49(\u4E0E\u6700\u65B0\u6A21\u578B\u540C\u6B65)",
      "\u652F\u6301 GPT 5.6 \u7CFB\u5217 & GPT Codex",
      "\u652F\u6301 gemini3",
      "\u5DE5\u7A0B\u5E081\u5BF91\u670D\u52A1"
    ]
  },
  {
    id: "claude_code_medium",
    name: "\u5927\u6708\u5361",
    description: "\u9002\u5408\u65E5\u5E38\u5F00\u53D1, \u7EA6\u7B49\u4E8E \u5B98\u65B9 $100  \u5957\u9910",
    period: "/\u6708",
    features: [
      "\u652F\u6301Claude 4.5 Opus & Sonnet 4.5\u7B49(\u4E0E\u6700\u65B0\u6A21\u578B\u540C\u6B65)",
      "\u652F\u6301 GPT 5.6 \u7CFB\u5217 & GPT Codex",
      "\u652F\u6301 gemini 3",
      "\u5DE5\u7A0B\u5E081\u5BF91\u670D\u52A1",
      "\u4F18\u5148\u6280\u672F\u652F\u6301"
    ]
  },
  {
    id: "claude_code_large",
    name: "\u8D85\u5927\u6708\u5361",
    description: "\u5B98\u65B9 $100 \u5957\u9910\u7684\u4E24\u500D\u989D\u5EA6\uFF0C\u9002\u5408\u9AD8\u5F3A\u5EA6\u5F00\u53D1",
    period: "/\u6708",
    features: [
      "\u9AD8\u5F3A\u5EA6\u5F00\u53D1\u4E13\u7528",
      "\u652F\u6301Claude 4.5 Opus & Sonnet 4.5\u7B49(\u4E0E\u6700\u65B0\u6A21\u578B\u540C\u6B65)",
      "\u652F\u6301 GPT 5.6 \u7CFB\u5217 & GPT Codex",
      "\u652F\u6301 gemini 3",
      "24/7 \u6280\u672F\u652F\u6301",
      "\u5DE5\u7A0B\u5E081\u5BF91\u670D\u52A1",
      "\u4F18\u5148\u6280\u672F\u652F\u6301"
    ],
    popular: true
  },
  {
    id: "claude_code_oneday",
    name: "\u5355\u65E5\u4F53\u9A8C\u5361",
    description: "",
    period: "/\u5929",
    credits: 0,
    features: [
      "24\u5C0F\u65F6\u5185\u6709\u6548",
      "\u652F\u6301Claude 4.5 Opus & Sonnet 4.5\u7B49(\u4E0E\u6700\u65B0\u6A21\u578B\u540C\u6B65)",
      "\u652F\u6301 GPT 5.6 \u7CFB\u5217 & GPT Codex",
      "\u652F\u6301 gemini 3"
    ],
    hideIfNotEligible: true
  },
  {
    id: "claude_code_coin_pack",
    name: "\u52A0\u6CB9\u5305",
    description: "",
    period: "/\u5929",
    credits: 0,
    features: [
      "\u652F\u6301Claude 4.5 Opus & Sonnet 4.5\u7B49(\u4E0E\u6700\u65B0\u6A21\u578B\u540C\u6B65)",
      "\u652F\u6301 GPT 5.6 \u7CFB\u5217 & GPT Codex",
      "\u652F\u6301 gemini 3"
    ],
    hasCoinPackSelector: true,
    hideIfNotEligible: true
  },
  {
    id: "sora2",
    name: "Sora2 \u4EA7\u54C1\u5305",
    description: "\u4E00\u952E\u89E3\u9501 Sora2 \u9AD8\u6E05\u89C6\u9891 \xB7 \u6309\u9700\u5145\u503C \xB7 $2 \u8D77",
    period: "/\u8D77\u5145",
    credits: 0,
    features: [
      "\u6309\u6B21\u8BA1\u8D39\uFF1A$0.02/\u6B21",
      "\u968F\u5145\u968F\u7528 \xB7 \u5230\u8D26\u5373\u7528",
      "\u652F\u6301\u591A\u955C\u5934/\u957F\u65F6\u9AD8\u6E05\u89C6\u9891\u751F\u6210",
      "\u4F18\u5148\u5904\u7406\u901A\u9053 \xB7 \u66F4\u5FEB\u51FA\u7247",
      "\u53EF\u53E0\u52A0\u5145\u503C \xB7 \u7075\u6D3B\u63A7\u5236\u6210\u672C"
    ],
    popular: true,
    customAmountInput: "sora2"
  }
];
function getPermanentCreditBundles() {
  const isDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (isDev) {
    return [
      { id: "perm_10", amount: 0.01, credits: 7200 },
      { id: "perm_50", amount: 0.05, credits: 36e3, bonus: 1800, note: "5% \u52A0\u8D60" },
      { id: "perm_300", amount: 0.3, credits: 216e3, bonus: 32400, note: "15% \u52A0\u8D60", isEnterprise: true },
      { id: "perm_1000", amount: 1, credits: 72e4, bonus: 144e3, note: "20% \u52A0\u8D60", isEnterprise: true }
    ];
  }
  return [
    { id: "perm_10", amount: 10, credits: 7200 },
    { id: "perm_50", amount: 50, credits: 36e3, bonus: 1800, note: "5% \u52A0\u8D60" },
    { id: "perm_300", amount: 300, credits: 216e3, bonus: 32400, note: "15% \u52A0\u8D60", isEnterprise: true },
    { id: "perm_1000", amount: 1e3, credits: 72e4, bonus: 144e3, note: "20% \u52A0\u8D60", isEnterprise: true }
  ];
}
var permanentContactEmail = "support@aicoding.inc";
var enterprisePlanFeatures = [
  {
    id: "team_size",
    name: "\u56E2\u961F\u89C4\u6A21\uFF08\u6839\u636E\u5957\u9910\u4E0D\u540C\uFF09",
    description: "\u5C0F\u56E2\u961F\uFF1A3-8\u4EBA | \u6210\u957F\u56E2\u961F\uFF1A8-15\u4EBA | \u4F01\u4E1A\u7248\uFF1A15+\u4EBA"
  },
  {
    id: "models",
    name: "Claude 4.5 Opus & Sonnet 4.5",
    highlight: true
  },
  {
    id: "gpt",
    name: "GPT 5.6 \u7CFB\u5217 & GPT Codex",
    highlight: true
  },
  {
    id: "gemini",
    name: "Gemini 3",
    highlight: true
  },
  {
    id: "api",
    name: "API \u8C03\u7528\uFF08\u66F4\u5927\u9608\u503C\uFF09"
  },
  {
    id: "team_management",
    name: "\u56E2\u961F\u7BA1\u7406\u529F\u80FD"
  },
  {
    id: "sla",
    name: "SLA\u4FDD\u8BC1"
  }
];
function getPlanDisplayQuota(plan, creditDisplay) {
  if (creditDisplay?.quota_calculation === "custom" && plan.display_quota) {
    return plan.display_quota;
  }
  return plan.price || plan.unit_price || 0;
}
function formatCreditDisplay(plan, creditDisplay) {
  const mode = creditDisplay?.mode || "quota";
  if (mode === "credit") {
    const dailyCredit = plan.daliy_credit || plan.daily_credit || plan.credits || 0;
    return `${dailyCredit.toLocaleString()}\u79EF\u5206/\u5929`;
  } else {
    const quota = getPlanDisplayQuota(plan, creditDisplay);
    return `${quota}\u7F8E\u5143\u989D\u5EA6`;
  }
}

// frontend/components/pricing/PlanOptionCard.jsx
function formatPriceWithSmallDecimal(price) {
  const integerPart = Math.floor(price);
  const decimalPart = Math.round(price % 1 * 10);
  return /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, integerPart, price % 1 !== 0 && /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-[0.7em]" }, ".", decimalPart));
}
function PlanOptionCard({
  plan,
  price,
  credits,
  selectedQty,
  onQtyChange,
  onPurchase,
  loading,
  hasDiscount,
  originalPrice,
  appliedCoupon,
  calcBulkNumbers: calcBulkNumbers2,
  formatPrice: formatPrice3,
  DISCOUNT_CONFIG: DISCOUNT_CONFIG2,
  onCardClick,
  // 新增：卡片点击回调
  isSelected = false,
  // 新增：是否为选中状态
  creditDisplay
  // 新增：积分展示配置
}) {
  const t2 = getTranslations("pricing", {});
  const { discounted, perMonth, save, tag } = calcBulkNumbers2(
    { id: plan.id, price },
    selectedQty
  );
  const isPopular = plan.popular;
  return /* @__PURE__ */ import_react6.default.createElement(
    "div",
    {
      className: `
				relative flex flex-col md:flex-row items-stretch min-h-[140px]
				bg-white rounded-2xl
				transition-all duration-300 cursor-pointer
				${isSelected ? "ring-2 ring-anthropic-primary shadow-xl z-10" : "border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200"}
				p-6 gap-6
			`,
      onClick: () => onCardClick && onCardClick(plan.id)
    },
    isPopular && /* @__PURE__ */ import_react6.default.createElement("div", { className: "absolute -top-3 -left-3 z-10" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "bg-anthropic-primary text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-md" }, /* @__PURE__ */ import_react6.default.createElement(FiStar, { className: "h-3 w-3 mr-1" }), "\u6700\u53D7\u6B22\u8FCE")),
    hasDiscount && appliedCoupon && /* @__PURE__ */ import_react6.default.createElement("div", { className: "absolute -top-2 -right-2 z-10" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white" }, "-", appliedCoupon.discount, "%")),
    /* @__PURE__ */ import_react6.default.createElement("div", { className: "md:w-1/4 flex flex-col justify-center min-h-[100px]" }, /* @__PURE__ */ import_react6.default.createElement("h3", { className: "text-lg font-bold text-gray-900 mb-1" }, t2.productNames?.[plan.id] || plan.name), /* @__PURE__ */ import_react6.default.createElement("p", { className: "text-xs text-gray-500 mb-3 leading-relaxed" }, plan.description), credits > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { className: "inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 self-start" }, /* @__PURE__ */ import_react6.default.createElement(FiZap, { className: "h-3 w-3 text-anthropic-primary mr-1.5" }), /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-xs font-semibold text-gray-700" }, formatCreditDisplay({ ...plan, daliy_credit: credits, price }, creditDisplay)))),
    /* @__PURE__ */ import_react6.default.createElement("div", { className: "md:w-1/4 flex flex-col justify-center min-h-[100px]" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "text-[10px] text-gray-400 mb-2 uppercase tracking-wide font-semibold" }, "\u8D2D\u4E70\u5468\u671F"), /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex bg-gray-100 p-1 rounded-lg w-fit" }, [1, 3, 12].map((qty) => {
      const config = DISCOUNT_CONFIG2[qty];
      return /* @__PURE__ */ import_react6.default.createElement(
        "button",
        {
          key: qty,
          onClick: (e) => {
            e.stopPropagation();
            onQtyChange(qty);
          },
          className: `
									px-3 py-1.5 rounded-md text-xs font-medium transition-all
									${selectedQty === qty ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}
								`
        },
        qty === 12 ? "\u5E74" : qty === 3 ? "\u5B63" : "\u6708"
      );
    })), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mt-2 text-xs h-5" }, selectedQty > 1 && tag && /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded text-[10px]" }, tag, " \xB7 \u6BCF\u6708 ", Math.round(perMonth)))),
    /* @__PURE__ */ import_react6.default.createElement("div", { className: "md:w-2/4 flex flex-col md:flex-row items-center justify-end gap-6 min-h-[100px]" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "text-right" }, hasDiscount && originalPrice ? /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "text-xs text-gray-400 line-through mb-0.5" }, "$", formatPriceWithSmallDecimal(originalPrice * selectedQty)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex items-baseline justify-end gap-1" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-2xl font-bold text-red-600" }, "$", formatPriceWithSmallDecimal(discounted))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "text-[10px] text-red-500 font-medium mt-0.5" }, "\u5DF2\u7701 ", appliedCoupon?.discount, "%")) : /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex items-baseline justify-end gap-1" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-3xl font-bold text-gray-900" }, "$", formatPriceWithSmallDecimal(discounted))), selectedQty > 1 && save > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { className: "text-xs text-green-600 mt-1 font-medium" }, "\u7701 $", formatPriceWithSmallDecimal(save)))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex-shrink-0 w-full md:w-auto" }, /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          onPurchase();
        },
        disabled: loading,
        className: `
							w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300
							flex items-center justify-center whitespace-nowrap
							bg-anthropic-primary text-white hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5
							disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
						`
      },
      loading ? /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "\u5904\u7406\u4E2D") : /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement(FiShoppingCart, { className: "h-4 w-4 mr-2" }), "\u7ACB\u5373\u8D2D\u4E70")
    )))
  );
}

// frontend/components/pricing/FlexiblePlanCard.jsx
var import_react7 = __toESM(require_react());
function FlexiblePlanCard({
  plan,
  sora2Amount,
  setSora2Amount,
  minTopup,
  coinPackType,
  setCoinPackType,
  coinPackChecking,
  coinPackEligible,
  enterpriseCoinPackChecking,
  enterpriseCoinPackEligible,
  loading,
  selectedPlan,
  onPlanSelect,
  isAuthenticated: isAuthenticated2,
  setActivePlanTab,
  showCouponInput,
  appliedCoupon,
  hasDiscount,
  originalPrice,
  planCredits,
  getQty,
  setQty,
  formatPrice: formatPrice3,
  calcBulkNumbers: calcBulkNumbers2,
  basePrice,
  // Calculated price passed from parent
  // 企业套餐列表（用于取企业加油包积分），未传则回退默认值
  enterprisePlans = [],
  creditDisplay
  // 新增：积分展示配置
}) {
  const t2 = getTranslations("pricing", {});
  const safePlanSelect = (payload) => {
    if (typeof onPlanSelect === "function") {
      onPlanSelect(payload);
    }
  };
  const renderCoinPackSelector = () => {
    const targetPlan = coinPackType === "enterprise" ? { id: "enterprise_coin_pack", price: 18, name: "\u4F01\u4E1A\u52A0\u6CB9\u5305" } : plan;
    const qty = Math.max(1, getQty(targetPlan));
    const { discounted, save } = calcBulkNumbers2(targetPlan, qty);
    const isEnterprise = targetPlan.id === "enterprise_coin_pack";
    const handleQuickSelect = (value) => {
      if (typeof value !== "number" || Number.isNaN(value) || value < 1) return;
      setQty(targetPlan, value);
    };
    const handleInputChange = (event) => {
      const next = parseInt(event.target.value, 10);
      if (Number.isNaN(next) || next < 1) {
        setQty(targetPlan, 1);
        return;
      }
      setQty(targetPlan, Math.min(next, 999));
    };
    if (isEnterprise) {
      return /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center justify-center gap-2" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs text-gray-500" }, "\u6570\u91CF"), /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          type: "number",
          min: "1",
          max: "999",
          value: qty,
          onChange: handleInputChange,
          className: "w-16 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        }
      ), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs text-gray-600" }, "\u5408\u8BA1 ", formatPrice3(discounted)));
    }
    return /* @__PURE__ */ import_react7.default.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center justify-center gap-1" }, [1, 2, 3].map((value) => {
      const coinDiscount = COIN_PACK_DISCOUNT[value];
      const label = value === 1 ? "1\u4EFD" : coinDiscount?.tag || `${value}\u4EFD`;
      return /* @__PURE__ */ import_react7.default.createElement(
        "button",
        {
          key: `coin-${value}`,
          type: "button",
          onClick: () => handleQuickSelect(value),
          className: `px-3 py-1.5 rounded-full text-xs font-medium transition ${qty === value ? "bg-anthropic-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`
        },
        label
      );
    })), save > 0 && /* @__PURE__ */ import_react7.default.createElement("div", { className: "text-center text-xs text-amber-600" }, "\u5408\u8BA1 ", formatPrice3(discounted), "\uFF0C\u7701 ", formatPrice3(save)));
  };
  return /* @__PURE__ */ import_react7.default.createElement(
    "div",
    {
      id: `plan-${plan.id}`,
      className: `
                relative flex flex-col h-full
                bg-white rounded-2xl
                border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300
                ${plan.id === "sora2" ? "ring-1 ring-purple-100" : ""}
            `
    },
    ["claude_code_oneday"].includes(plan.id) && /* @__PURE__ */ import_react7.default.createElement("div", { className: "absolute -top-3 -right-3 z-10" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "bg-anthropic-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md" }, t2.flexiblePlanCard?.newUser || "\u65B0\u7528\u6237")),
    plan.id === "sora2" && /* @__PURE__ */ import_react7.default.createElement("div", { className: "absolute -top-3 -right-3 z-10" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md" }, t2.flexiblePlanCard?.hot || "\u70ED\u95E8")),
    plan.id === "claude_code_coin_pack" && /* @__PURE__ */ import_react7.default.createElement("div", { className: "absolute -top-4 left-1/2 -translate-x-1/2 z-10" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "bg-white border border-gray-200 shadow-md rounded-full flex overflow-hidden" }, /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          setCoinPackType("personal");
        },
        className: `px-3 py-1 text-[11px] font-bold transition ${coinPackType === "personal" ? "bg-anthropic-primary text-white" : "text-gray-600 hover:text-gray-900"}`
      },
      t2.flexiblePlanCard?.personal || "\u4E2A\u4EBA"
    ), /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          setCoinPackType("enterprise");
        },
        className: `px-3 py-1 text-[11px] font-bold transition ${coinPackType === "enterprise" ? "bg-anthropic-primary text-white" : "text-gray-600 hover:text-gray-900"}`
      },
      t2.flexiblePlanCard?.enterprise || "\u4F01\u4E1A"
    ))),
    showCouponInput && hasDiscount && /* @__PURE__ */ import_react7.default.createElement("div", { className: "absolute -top-3 -left-3 z-10" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white" }, "-", appliedCoupon.discount, "%")),
    /* @__PURE__ */ import_react7.default.createElement("div", { className: "p-6 flex flex-col h-full" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ import_react7.default.createElement("h3", { className: "text-lg font-bold text-gray-900 mb-2" }, plan.id === "claude_code_coin_pack" ? coinPackType === "personal" ? t2.flexiblePlanCard?.personalBooster || "\u4E2A\u4EBA\u52A0\u6CB9\u5305" : t2.flexiblePlanCard?.enterpriseBooster || "\u4F01\u4E1A\u52A0\u6CB9\u5305" : t2.productNames?.[plan.id] || plan.name), /* @__PURE__ */ import_react7.default.createElement("p", { className: "text-gray-500 text-xs mb-4 min-h-[32px] leading-relaxed" }, plan.id === "claude_code_coin_pack" ? coinPackType === "personal" ? plan.description : t2.flexiblePlanCard?.tempTeamQuota || "\u4E34\u65F6\u8865\u5145\u56E2\u961F\u79EF\u5206\u989D\u5EA6" : plan.description), /* @__PURE__ */ import_react7.default.createElement("div", { className: "mb-4 space-y-3" }, plan.id === "claude_code_coin_pack" ? /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-baseline justify-center" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-3xl font-bold text-gray-900" }, "$", coinPackType === "personal" ? formatPrice3(basePrice) : "18"), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs text-gray-400 ml-1 font-medium" }, "/24\u5C0F\u65F6")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100" }, /* @__PURE__ */ import_react7.default.createElement(FiZap, { className: "h-3 w-3 text-anthropic-primary mr-1.5" }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs font-semibold text-gray-700" }, (() => {
      const mode = creditDisplay?.mode || "quota";
      if (coinPackType === "personal") {
        const credits = planCredits > 0 ? planCredits : 1e4;
        if (mode === "credit") {
          return `${credits.toLocaleString()}\u79EF\u5206`;
        } else {
          const price = typeof basePrice === "number" ? basePrice : plan.price || 4.14;
          return `${price}\u7F8E\u5143\u4E34\u65F6\u989D\u5EA6`;
        }
      } else {
        const enterpriseCoinPack = (enterprisePlans || []).find((p) => p.id === "enterprise_coin_pack");
        const credits = enterpriseCoinPack?.credits || 35e3;
        if (mode === "credit") {
          return `${credits.toLocaleString()}\u79EF\u5206`;
        } else {
          const price = enterpriseCoinPack?.price || 21;
          return `${price}\u7F8E\u5143\u4E34\u65F6\u989D\u5EA6`;
        }
      }
    })()))) : /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, showCouponInput && hasDiscount ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "text-center" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "text-xs text-gray-400 line-through mb-0.5" }, "$", formatPrice3(originalPrice), plan.period), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-baseline justify-center gap-1" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-3xl font-bold text-red-600" }, "$", formatPrice3(basePrice)), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs text-gray-400 font-medium" }, plan.period)), /* @__PURE__ */ import_react7.default.createElement("span", { className: "inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600" }, "\u7701 ", appliedCoupon.discount, "%")) : /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-baseline justify-center" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-3xl font-bold text-gray-900" }, "$", formatPrice3(basePrice)), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs text-gray-400 ml-1 font-medium" }, plan.period)), !plan.customAmountInput && planCredits > 0 && /* @__PURE__ */ import_react7.default.createElement("div", { className: "inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100" }, /* @__PURE__ */ import_react7.default.createElement(FiZap, { className: "h-3 w-3 text-anthropic-primary mr-1.5" }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs font-semibold text-gray-700" }, formatCreditDisplay({ ...plan, daliy_credit: planCredits, price: basePrice }, creditDisplay))))), plan.customAmountInput === "sora2" && /* @__PURE__ */ import_react7.default.createElement("div", { className: "mb-4 space-y-3" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-wide" }, "\u5145\u503C\u91D1\u989D (\u6700\u4F4E ", formatPrice3(minTopup), ")"), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex flex-wrap items-center justify-center gap-2" }, (minTopup <= 0.01 ? [0.01, 0.1, 1, 9.9] : [9.9, 19.9, 49, 99]).map((v) => /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        key: `sora2-quick-${v}`,
        type: "button",
        onClick: () => setSora2Amount(v),
        className: `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formatPrice3(Number(sora2Amount)) == formatPrice3(Number(v)) ? "bg-anthropic-primary border-anthropic-primary text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`
      },
      v
    ))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "text-center text-[10px] text-gray-500 bg-gray-50 rounded-lg py-1.5 px-3 mx-auto w-fit" }, "\u2248 ", /* @__PURE__ */ import_react7.default.createElement("span", { className: "font-bold text-gray-900" }, Math.max(0, Math.floor(Number(sora2Amount || 0) / 0.02))), " \u6B21\u751F\u6210")), plan.hasCoinPackSelector && /* @__PURE__ */ import_react7.default.createElement("div", { className: "mb-2" }, renderCoinPackSelector()), plan.id === "claude_code_coin_pack" && isAuthenticated2() && /* @__PURE__ */ import_react7.default.createElement("div", { className: "mb-2 text-[10px]" }, coinPackType === "personal" ? coinPackChecking ? /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-gray-400" }, t2.flexiblePlanCard?.checking || "\u8D44\u683C\u6821\u9A8C\u4E2D...") : coinPackEligible === false ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "rounded-lg bg-amber-50 text-amber-800 px-3 py-2 text-center" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "block mb-1 font-medium" }, t2.flexiblePlanCard?.needMonthlyCard || "\u9700\u8981\u6708\u5361\u8D44\u683C"), /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        onClick: () => {
          setActivePlanTab("personal");
          setTimeout(() => {
            const el = document.getElementById("plan-claude_code_normal");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        },
        className: "inline-flex items-center px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-bold transition-colors"
      },
      t2.flexiblePlanCard?.buyMonthlyCard || "\u53BB\u8D2D\u4E70\u6708\u5361"
    )) : null : enterpriseCoinPackChecking ? /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-gray-400" }, t2.flexiblePlanCard?.checking || "\u8D44\u683C\u6821\u9A8C\u4E2D...") : enterpriseCoinPackEligible === false ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "rounded-lg bg-amber-50 text-amber-800 px-3 py-2 text-center" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "block mb-1 font-medium" }, t2.flexiblePlanCard?.needEnterprise || "\u9700\u8981\u4F01\u4E1A\u5957\u9910\u8D44\u683C"), /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        onClick: () => {
          setActivePlanTab("enterprise");
          setTimeout(() => {
            const el = document.getElementById("plan-enterprise_growth");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        },
        className: "inline-flex items-center px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-bold transition-colors"
      },
      t2.flexiblePlanCard?.buyEnterprise || "\u53BB\u8D2D\u4E70\u4F01\u4E1A\u5957\u9910"
    )) : null)), /* @__PURE__ */ import_react7.default.createElement("div", { className: "space-y-3 mb-6 flex-grow px-2" }, plan.id === "claude_code_coin_pack" ? /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, coinPackType === "personal" ? plan.features.slice(0, 3).map((feature, index) => /* @__PURE__ */ import_react7.default.createElement("div", { key: index, className: "flex items-start" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "p-0.5 bg-green-100 rounded-full mr-2 mt-0.5 flex-shrink-0" }, /* @__PURE__ */ import_react7.default.createElement(FiCheck, { className: "h-2.5 w-2.5 text-green-600" })), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-gray-600 text-xs leading-tight" }, feature))) : /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "p-0.5 bg-green-100 rounded-full mr-2 mt-0.5 flex-shrink-0" }, /* @__PURE__ */ import_react7.default.createElement(FiCheck, { className: "h-2.5 w-2.5 text-green-600" })), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-gray-600 text-xs leading-tight" }, t2.flexiblePlanCard?.validFor24h || "24\u5C0F\u65F6\u5185\u6709\u6548")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "p-0.5 bg-green-100 rounded-full mr-2 mt-0.5 flex-shrink-0" }, /* @__PURE__ */ import_react7.default.createElement(FiCheck, { className: "h-2.5 w-2.5 text-green-600" })), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-gray-600 text-xs leading-tight" }, t2.flexiblePlanCard?.forGrowthTeam || "\u9002\u5408\u6210\u957F\u56E2\u961F\u7248\u4E34\u65F6\u589E\u91CF")))) : plan.features.slice(0, 3).map((feature, index) => /* @__PURE__ */ import_react7.default.createElement(
      "div",
      {
        key: index,
        className: "flex items-start"
      },
      /* @__PURE__ */ import_react7.default.createElement("div", { className: "p-0.5 bg-green-100 rounded-full mr-2 mt-0.5 flex-shrink-0" }, /* @__PURE__ */ import_react7.default.createElement(FiCheck, { className: "h-2.5 w-2.5 text-green-600" })),
      /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-gray-600 text-xs leading-tight" }, feature)
    ))), /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          if (plan.id === "claude_code_coin_pack") {
            const planToSelect = coinPackType === "enterprise" ? { id: "enterprise_coin_pack", price: 18, name: "\u4F01\u4E1A\u52A0\u6CB9\u5305" } : { id: plan.id, price: basePrice, name: plan.name };
            safePlanSelect(planToSelect);
          } else {
            safePlanSelect({ id: plan.id, price: basePrice, name: plan.name });
          }
        },
        disabled: loading || plan.id === "claude_code_coin_pack" && isAuthenticated2() && (coinPackType === "personal" ? coinPackEligible === false : enterpriseCoinPackEligible === false) || plan.id === "sora2" && Number(sora2Amount || 0) < minTopup,
        className: `
                        w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300
                        flex items-center justify-center
                        ${plan.id === "sora2" ? "bg-anthropic-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5" : "bg-anthropic-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"}
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                    `
      },
      loading && selectedPlan?.id === plan.id ? /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" }), t2.flexiblePlanCard?.processing || "\u5904\u7406\u4E2D") : /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, /* @__PURE__ */ import_react7.default.createElement(FiShoppingCart, { className: "h-4 w-4 mr-2" }), plan.id === "sora2" ? t2.flexiblePlanCard?.topUpNow || "\u7ACB\u5373\u5145\u503C" : t2.flexiblePlanCard?.buyNow || "\u7ACB\u5373\u8D2D\u4E70")
    ))
  );
}

// frontend/components/pricing/FlexibleTopupCard.jsx
var import_react8 = __toESM(require_react());
function FlexibleTopupCard({
  loading,
  selectedPlan,
  onPlanSelect,
  onAmountChange
  // 新增：当金额变化时通知父组件
}) {
  const t2 = getTranslations("pricing", {});
  const [amount, setAmount] = (0, import_react8.useState)(10);
  const minAmount = 10;
  const isEnterpriseAmount = amount >= 300;
  const handleAmountUpdate = (newAmount) => {
    setAmount(newAmount);
    if (onAmountChange) {
      onAmountChange(newAmount);
    }
  };
  const getStepSize = (currentAmount) => {
    if (currentAmount >= 1e4) return 1e4;
    if (currentAmount >= 1e3) return 1e3;
    if (currentAmount >= 50) return 50;
    return 1;
  };
  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    if (value >= 0) {
      handleAmountUpdate(value);
    }
  };
  const handleQuickSelect = (value) => {
    handleAmountUpdate(value);
  };
  const handleIncrement = () => {
    const step = getStepSize(amount);
    handleAmountUpdate(amount + step);
  };
  const handleDecrement = () => {
    const step = getStepSize(amount);
    handleAmountUpdate(Math.max(minAmount, amount - step));
  };
  const handlePurchase = () => {
    if (amount < minAmount) {
      return;
    }
    onPlanSelect({
      id: "flexible_topup",
      price: amount,
      name: t2.flexible?.title || "\u968F\u5FC3\u7528"
    });
  };
  const isLoading = loading && selectedPlan?.id === "flexible_topup";
  const isValid = amount >= minAmount;
  return /* @__PURE__ */ import_react8.default.createElement("div", { className: "bg-white rounded-2xl shadow-lg border-2 border-anthropic-primary p-8 relative overflow-hidden" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-anthropic-primary/10 to-transparent rounded-full -mr-16 -mt-16" }), /* @__PURE__ */ import_react8.default.createElement("div", { className: "relative mb-6" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ import_react8.default.createElement(Zap, { className: "h-6 w-6 text-anthropic-primary" }), /* @__PURE__ */ import_react8.default.createElement("h3", { className: "text-2xl font-bold text-gray-900" }, t2.flexible?.title || "\u968F\u5FC3\u7528")), /* @__PURE__ */ import_react8.default.createElement("p", { className: "text-sm text-gray-600" }, t2.flexible?.subtitle || "\u7075\u6D3B\u5145\u503C\uFF0C\u6309\u9700\u4F7F\u7528")), /* @__PURE__ */ import_react8.default.createElement("div", { className: "bg-gradient-to-br from-anthropic-primary-50 to-amber-50 rounded-xl p-6 mb-6" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-start gap-3 mb-4" }, /* @__PURE__ */ import_react8.default.createElement(DollarSign, { className: "h-5 w-5 text-anthropic-primary mt-0.5 flex-shrink-0" }), /* @__PURE__ */ import_react8.default.createElement("div", null, /* @__PURE__ */ import_react8.default.createElement("p", { className: "text-sm font-semibold text-gray-900 mb-1" }, t2.flexible?.topupOneUsd || "\u5145\u503C 1 \u7F8E\u5143 = \u83B7\u5F97 1 \u7F8E\u5143\u989D\u5EA6"), /* @__PURE__ */ import_react8.default.createElement("p", { className: "text-xs text-gray-600" }, t2.flexible?.minAmount || "\u6700\u5C0F\u5145\u503C\u91D1\u989D", " ", minAmount, " ", t2.flexible?.usd || "\u7F8E\u5143\uFF0C\u652F\u6301\u4EFB\u610F\u91D1\u989D"))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "space-y-2 text-xs text-gray-700" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-anthropic-primary" }), /* @__PURE__ */ import_react8.default.createElement("span", null, "Claude ", /* @__PURE__ */ import_react8.default.createElement("span", { className: "text-red-600 font-bold text-sm" }, "4\u6298"), "\u6D88\u8017 \xB7 \u652F\u6301Claude 4.5 Opus & Sonnet 4.5\u7B49\u6700\u65B0\u6A21\u578B")), /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-anthropic-primary" }), /* @__PURE__ */ import_react8.default.createElement("span", null, "Codex ", /* @__PURE__ */ import_react8.default.createElement("span", { className: "text-red-600 font-bold text-sm" }, "1\u6298"), "\u6D88\u8017 \xB7 \u652F\u6301 GPT 5.6 \u7CFB\u5217 & GPT Codex")), /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-anthropic-primary" }), /* @__PURE__ */ import_react8.default.createElement("span", null, "\u652F\u6301 Gemini 3")))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "mb-6" }, /* @__PURE__ */ import_react8.default.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-3" }, t2.flexible?.amountLabel || "\u5145\u503C\u91D1\u989D\uFF08\u7F8E\u5143\uFF09"), /* @__PURE__ */ import_react8.default.createElement("div", { className: "grid grid-cols-4 gap-2 mb-4" }, [10, 50, 300, 1e3].map((value) => {
    const isEnterprise = value >= 300;
    return /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        key: value,
        type: "button",
        onClick: () => handleQuickSelect(value),
        className: `py-2 px-3 rounded-lg text-sm font-medium transition relative ${amount === value ? "bg-anthropic-primary text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`
      },
      isEnterprise && /* @__PURE__ */ import_react8.default.createElement(Briefcase, { className: "inline h-3 w-3 mr-0.5 -mt-0.5" }),
      "$",
      value
    );
  })), /* @__PURE__ */ import_react8.default.createElement("div", { className: "relative flex items-center gap-2" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold z-10" }, "$"), /* @__PURE__ */ import_react8.default.createElement(
    "input",
    {
      type: "number",
      min: minAmount,
      step: "1",
      value: amount,
      onChange: handleAmountChange,
      className: "flex-1 pl-10 pr-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-anthropic-primary transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
      placeholder: `\u6700\u5C0F ${minAmount}`
    }
  ), /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleIncrement,
      className: "p-2 bg-anthropic-primary hover:bg-anthropic-primary-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-95",
      title: `\u589E\u52A0 $${getStepSize(amount)}`
    },
    /* @__PURE__ */ import_react8.default.createElement(ChevronUp, { className: "h-5 w-5" })
  ), /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleDecrement,
      disabled: amount <= minAmount,
      className: `p-2 rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-95 ${amount <= minAmount ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-anthropic-primary hover:bg-anthropic-primary-600 text-white"}`,
      title: `\u51CF\u5C11 $${getStepSize(amount)}`
    },
    /* @__PURE__ */ import_react8.default.createElement(ChevronDown, { className: "h-5 w-5" })
  ))), /* @__PURE__ */ import_react8.default.createElement("p", { className: "mt-2 text-xs text-gray-500 text-center" }, t2.flexible?.currentStep || "\u5F53\u524D\u6B65\u957F\uFF1A$", getStepSize(amount), " ", t2.flexible?.stepNote || "\uFF08\u70B9\u51FB \u2191\u2193 \u6309\u94AE\u8C03\u6574\uFF09"), !isValid && /* @__PURE__ */ import_react8.default.createElement("p", { className: "mt-2 text-xs text-red-600" }, t2.flexible?.minAmountError || "\u6700\u5C0F\u5145\u503C\u91D1\u989D\u4E3A", " ", minAmount, " ", t2.flexible?.usd?.split("\uFF0C")[0] || "\u7F8E\u5143")), /* @__PURE__ */ import_react8.default.createElement("div", { className: "bg-gray-50 rounded-xl p-4 mb-6" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "text-sm text-gray-600" }, t2.flexible?.youWillGet || "\u60A8\u5C06\u83B7\u5F97"), /* @__PURE__ */ import_react8.default.createElement("div", { className: "text-right" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "text-2xl font-bold text-anthropic-primary" }, "$", isValid ? amount.toFixed(2) : "0.00"), /* @__PURE__ */ import_react8.default.createElement("span", { className: "text-sm text-gray-600 ml-2" }, t2.flexible?.quota || "\u989D\u5EA6")))), isEnterpriseAmount && /* @__PURE__ */ import_react8.default.createElement("div", { className: "bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-center text-blue-900 font-bold text-sm mb-3" }, /* @__PURE__ */ import_react8.default.createElement(Briefcase, { className: "h-4 w-4 mr-2" }), t2.flexible?.enterpriseBenefits || "\u4F01\u4E1A\u7248\u4E13\u5C5E\u6743\u76CA"), /* @__PURE__ */ import_react8.default.createElement("div", { className: "space-y-2 text-xs text-blue-800" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "mr-2" }, "\u2022"), /* @__PURE__ */ import_react8.default.createElement("span", null, t2.flexible?.multipleApiKeys || "\u72EC\u7ACB\u591A\u4E2AAPI Key - \u53EF\u4E3A\u4E0D\u540C\u573A\u666F\u914D\u7F6E\u4E13\u5C5E\u5BC6\u94A5")), /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "mr-2" }, "\u2022"), /* @__PURE__ */ import_react8.default.createElement("span", null, t2.flexible?.prioritySupport || "\u4F18\u5148\u6280\u672F\u652F\u6301 - \u4E13\u5C5E\u5BA2\u670D\u901A\u9053\uFF0C\u5FEB\u901F\u54CD\u5E94")), /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "mr-2" }, "\u2022"), /* @__PURE__ */ import_react8.default.createElement("span", null, t2.flexible?.teamManagement || "\u56E2\u961F\u6210\u5458\u989D\u5EA6\u7BA1\u7406 - \u7CBE\u7EC6\u5316\u914D\u989D\u63A7\u5236")))), /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      type: "button",
      onClick: handlePurchase,
      disabled: !isValid || isLoading,
      className: `w-full py-4 rounded-xl font-bold text-lg transition-all ${isValid && !isLoading ? "bg-anthropic-primary text-white hover:bg-anthropic-primary-600 shadow-lg hover:shadow-xl" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`
    },
    isLoading ? /* @__PURE__ */ import_react8.default.createElement("span", { className: "flex items-center justify-center gap-2" }, /* @__PURE__ */ import_react8.default.createElement("svg", { className: "animate-spin h-5 w-5", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react8.default.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), /* @__PURE__ */ import_react8.default.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })), t2.flexible?.processing || "\u5904\u7406\u4E2D...") : t2.flexible?.buyNow || "\u7ACB\u5373\u5145\u503C"
  ));
}

// frontend/components/pricing/TokenCard.jsx
var import_react9 = __toESM(require_react());
function TokenCard({
  selectedBundle,
  onBundleSelect,
  bundles,
  onContact,
  onPurchase,
  loading,
  selectedPlanId
}) {
  return /* @__PURE__ */ import_react9.default.createElement(
    "div",
    {
      id: "permanent",
      "data-plan-id": "plan-permanent_credits",
      className: "\n                    relative flex flex-col h-full\n                    bg-white rounded-2xl\n                    border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300\n                "
    },
    /* @__PURE__ */ import_react9.default.createElement("div", { className: "absolute -top-3 -right-3 z-10" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "bg-anthropic-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center" }, /* @__PURE__ */ import_react9.default.createElement(Gift, { className: "h-3 w-3 mr-0.5" }), "\u7EA61.4\u6298")),
    /* @__PURE__ */ import_react9.default.createElement("div", { className: "p-6 flex flex-col h-full" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ import_react9.default.createElement("h3", { className: "text-lg font-bold text-gray-900 mb-2" }, "TOKEN\u8D26\u6237\u5145\u503C"), /* @__PURE__ */ import_react9.default.createElement("p", { className: "text-gray-500 text-xs mb-4 min-h-[32px] leading-relaxed" }, "\u65E0\u8FC7\u671F\u65F6\u95F4 \xB7 \u53EF\u642D\u914D\u4EFB\u610F\u5957\u9910\u4F7F\u7528"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "mb-4 space-y-3" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-baseline justify-center" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-3xl font-bold text-gray-900" }, selectedBundle.amount), /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-xs text-gray-400 ml-1 font-medium" }, "\u8D77")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100" }, /* @__PURE__ */ import_react9.default.createElement(Zap, { className: "h-3 w-3 text-anthropic-primary mr-1.5" }), /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-xs font-semibold text-gray-700" }, "\u7B49\u503CToken ", selectedBundle.credits / 100)), selectedBundle.bonus && /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-center text-[10px] text-green-600 font-bold flex items-center justify-center gap-1 bg-green-50 rounded-md py-1 px-2 mx-auto w-fit" }, /* @__PURE__ */ import_react9.default.createElement(Gift, { className: "w-3 h-3" }), "\u989D\u5916\u8D60\u9001 +", selectedBundle.bonus / 100, " (", selectedBundle.note, ")")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "mb-4 space-y-2" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-wide" }, "\u9009\u62E9\u5957\u9910"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex flex-wrap items-center justify-center gap-2" }, bundles.map((bundle) => {
      const isActive = selectedBundle.id === bundle.id;
      const isEnterprise = bundle.isEnterprise;
      return /* @__PURE__ */ import_react9.default.createElement(
        "button",
        {
          key: bundle.id,
          type: "button",
          onClick: () => onBundleSelect(bundle),
          className: `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all relative ${isActive ? "bg-anthropic-primary border-anthropic-primary text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`
        },
        isEnterprise && /* @__PURE__ */ import_react9.default.createElement(Briefcase, { className: "inline h-3 w-3 mr-1" }),
        bundle.amount,
        bundle.note && /* @__PURE__ */ import_react9.default.createElement("span", { className: "ml-1 text-[9px] opacity-80" }, bundle.note)
      );
    })), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-center text-[10px] text-gray-500 bg-gray-50 rounded-lg py-1.5 px-3 mx-auto w-fit" }, "\u83B7\u5F97 ", /* @__PURE__ */ import_react9.default.createElement("span", { className: "font-bold text-gray-900" }, selectedBundle.credits / 100), " \u7B49\u503CToken"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "space-y-3 mb-6 flex-grow px-2" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "p-0.5 bg-gray-100 rounded-full mr-2 mt-0.5 flex-shrink-0" }, /* @__PURE__ */ import_react9.default.createElement(Check, { className: "h-2.5 w-2.5 text-gray-600" })), /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-gray-600 text-xs leading-tight" }, "\u6C38\u4E45\u6709\u6548 \xB7 \u53EF\u8DE8\u8D26\u53F7\u8F6C\u79FB")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "p-0.5 bg-gray-100 rounded-full mr-2 mt-0.5 flex-shrink-0" }, /* @__PURE__ */ import_react9.default.createElement(Check, { className: "h-2.5 w-2.5 text-gray-600" })), /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-gray-600 text-xs leading-tight" }, "\u7EA6\u5B98\u65B9API\u76841.4\u6298")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "p-0.5 bg-gray-100 rounded-full mr-2 mt-0.5 flex-shrink-0" }, /* @__PURE__ */ import_react9.default.createElement(Check, { className: "h-2.5 w-2.5 text-gray-600" })), /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-gray-600 text-xs leading-tight" }, "\u9002\u5408\u81EA\u5EFA\u6A21\u578B\u3001\u6279\u91CF\u751F\u6210\u573A\u666F")), selectedBundle.isEnterprise ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "rounded-xl p-4 space-y-3 transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 shadow-md" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-center justify-center" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "px-3 py-1.5 rounded-full flex items-center shadow-sm transition-all duration-300 bg-blue-500 text-white" }, /* @__PURE__ */ import_react9.default.createElement(Briefcase, { className: "h-4 w-4 mr-1.5" }), /* @__PURE__ */ import_react9.default.createElement("span", { className: "font-bold text-xs" }, "\u{1F389} \u5DF2\u89E3\u9501\u4F01\u4E1A\u7248\u4E13\u5C5E\u6743\u76CA"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start rounded-lg p-2 transition-all duration-300 bg-white/70" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 transition-all duration-300 bg-green-500" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-white font-bold text-xs" }, "\u2713")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "font-semibold text-xs mb-0.5 text-gray-900" }, "\u53EF\u914D\u7F6E\u591A\u4E2AAPI Key"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-[10px] text-gray-600" }, "\u4E3A\u4E0D\u540C\u573A\u666F\u914D\u7F6E\u4E13\u5C5E\u5BC6\u94A5"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start rounded-lg p-2 transition-all duration-300 bg-white/70" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 transition-all duration-300 bg-green-500" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-white font-bold text-xs" }, "\u2713")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "font-semibold text-xs mb-0.5 text-gray-900" }, "\u4F18\u5148\u6280\u672F\u652F\u6301"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-[10px] text-gray-600" }, "\u4E13\u5C5E\u5BA2\u670D\u901A\u9053\uFF0C\u5FEB\u901F\u54CD\u5E94"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start rounded-lg p-2 transition-all duration-300 bg-white/70" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 transition-all duration-300 bg-green-500" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-white font-bold text-xs" }, "\u2713")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "font-semibold text-xs mb-0.5 text-gray-900" }, "\u56E2\u961F\u6210\u5458\u989D\u5EA6\u7BA1\u7406"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-[10px] text-gray-600" }, "\u7CBE\u7EC6\u5316\u914D\u989D\u63A7\u5236\u4E0E\u7EDF\u8BA1")))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-center pt-1" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "inline-flex items-center rounded-lg px-2.5 py-1 transition-all duration-300 bg-amber-100 border border-amber-300" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "font-bold text-[10px] text-amber-800" }, "\u{1F48E} \u4F01\u4E1A\u7EA7\u670D\u52A1\uFF0C\u52A9\u529B\u56E2\u961F\u9AD8\u6548\u534F\u4F5C")))) : /* @__PURE__ */ import_react9.default.createElement("div", { className: "rounded-xl p-4 space-y-3 transition-all duration-300 bg-gray-50 border border-gray-300" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-center justify-center" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "px-3 py-1.5 rounded-full flex items-center shadow-sm transition-all duration-300 bg-gray-200 text-gray-500" }, /* @__PURE__ */ import_react9.default.createElement(Briefcase, { className: "h-4 w-4 mr-1.5" }), /* @__PURE__ */ import_react9.default.createElement("span", { className: "font-bold text-xs" }, "\u{1F4BC} \u5145\u503C\u2265$300\u89E3\u9501\u4F01\u4E1A\u7248"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start rounded-lg p-2 transition-all duration-300 bg-white/40" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 transition-all duration-300 bg-gray-300" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-white font-bold text-xs" }, "\u2713")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "font-semibold text-xs mb-0.5 text-gray-600" }, "\u53EF\u914D\u7F6E\u591A\u4E2AAPI Key"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-[10px] text-gray-600" }, "\u4E3A\u4E0D\u540C\u573A\u666F\u914D\u7F6E\u4E13\u5C5E\u5BC6\u94A5"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start rounded-lg p-2 transition-all duration-300 bg-white/40" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 transition-all duration-300 bg-gray-300" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-white font-bold text-xs" }, "\u2713")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "font-semibold text-xs mb-0.5 text-gray-600" }, "\u4F18\u5148\u6280\u672F\u652F\u6301"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-[10px] text-gray-600" }, "\u4E13\u5C5E\u5BA2\u670D\u901A\u9053\uFF0C\u5FEB\u901F\u54CD\u5E94"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start rounded-lg p-2 transition-all duration-300 bg-white/40" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 transition-all duration-300 bg-gray-300" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-white font-bold text-xs" }, "\u2713")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "font-semibold text-xs mb-0.5 text-gray-600" }, "\u56E2\u961F\u6210\u5458\u989D\u5EA6\u7BA1\u7406"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-[10px] text-gray-600" }, "\u7CBE\u7EC6\u5316\u914D\u989D\u63A7\u5236\u4E0E\u7EDF\u8BA1")))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "text-center pt-1" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "inline-flex items-center rounded-lg px-2.5 py-1 transition-all duration-300 bg-gray-100 border border-gray-300" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "font-bold text-[10px] text-gray-600" }, "\u2B06\uFE0F \u5145\u503C\u66F4\u591A\u91D1\u989D\uFF0C\u89E3\u9501\u4F01\u4E1A\u7EA7\u670D\u52A1")))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "p-0.5 bg-gray-100 rounded-full mr-2 mt-0.5 flex-shrink-0" }, /* @__PURE__ */ import_react9.default.createElement(Mail, { className: "h-2.5 w-2.5 text-gray-600" })), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        type: "button",
        onClick: onContact,
        className: "text-xs text-gray-600 hover:text-gray-900 transition leading-tight text-left underline underline-offset-2"
      },
      "\u5927\u989D\u5B9A\u5236\u9700\u6C42\uFF1F\u8054\u7CFB\u5BA2\u670D"
    ))), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        onClick: () => onPurchase(selectedBundle),
        disabled: loading && selectedPlanId === selectedBundle.id,
        className: "\n                            w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300\n                            flex items-center justify-center\n                            bg-anthropic-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5\n                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none\n                        "
      },
      loading && selectedPlanId === selectedBundle.id ? /* @__PURE__ */ import_react9.default.createElement(import_react9.default.Fragment, null, /* @__PURE__ */ import_react9.default.createElement("div", { className: "animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5" }), "\u5904\u7406\u4E2D") : /* @__PURE__ */ import_react9.default.createElement(import_react9.default.Fragment, null, /* @__PURE__ */ import_react9.default.createElement(ShoppingCart, { className: "h-3 w-3 mr-1.5" }), "\u7ACB\u5373\u8D2D\u4E70")
    ))
  );
}

// frontend/components/pricing/FeatureList.jsx
var import_react10 = __toESM(require_react());
function formatPriceWithSmallDecimal2(price) {
  const integerPart = Math.floor(price);
  const decimalPart = Math.round(price % 1 * 10);
  return /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, integerPart, price % 1 !== 0 && /* @__PURE__ */ import_react10.default.createElement("span", { className: "text-[0.7em]" }, ".", decimalPart));
}
function FeatureList({
  title = "\u6838\u5FC3\u529F\u80FD",
  features = [],
  comparisonData = null,
  selectedPlanId = null,
  // 新增：当前选中的套餐ID
  selectedPlanName = "",
  // 新增：当前选中的套餐名称
  selectedPlanCredits = 0,
  // 新增：当前选中套餐的积分
  selectedPlanPrice = 0,
  // 新增：当前选中套餐的月价格
  DISCOUNT_CONFIG: DISCOUNT_CONFIG2 = null,
  // 新增：折扣配置
  creditDisplay = null
  // 新增：积分展示配置
}) {
  return /* @__PURE__ */ import_react10.default.createElement("div", { className: "w-full lg:w-1/3 bg-[#F8F6F0]/95 backdrop-blur-sm rounded-2xl border-2 border-gray-200 p-6 h-full" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mb-4" }, /* @__PURE__ */ import_react10.default.createElement("h3", { className: "text-lg font-bold text-gray-900 mb-1 flex items-center" }, /* @__PURE__ */ import_react10.default.createElement(FiCheck, { className: "h-5 w-5 text-green-500 mr-2" }), title), selectedPlanName && (selectedPlanCredits > 0 || selectedPlanPrice > 0) && /* @__PURE__ */ import_react10.default.createElement("div", { className: "flex items-baseline gap-2 ml-7 min-h-[32px]" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "text-xs text-gray-600" }, formatCreditDisplay(
    { daliy_credit: selectedPlanCredits, price: selectedPlanPrice },
    creditDisplay || { mode: "quota", quota_calculation: "price" }
  ), " \xB7 ", selectedPlanName))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "space-y-3" }, features.map((feature, index) => {
    const isSupported = !selectedPlanId || !feature.supportedBy || feature.supportedBy.includes(selectedPlanId);
    return /* @__PURE__ */ import_react10.default.createElement("div", { key: feature.id || index, className: `flex items-start ${!isSupported ? "opacity-40" : ""}` }, isSupported ? /* @__PURE__ */ import_react10.default.createElement(FiCheck, { className: "h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" }) : /* @__PURE__ */ import_react10.default.createElement(FiX, { className: "h-3.5 w-3.5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" }), /* @__PURE__ */ import_react10.default.createElement("span", { className: `text-sm ${isSupported ? feature.highlight ? "font-semibold text-purple-600" : "text-gray-700" : "text-gray-400"}` }, feature.name, feature.description && isSupported && /* @__PURE__ */ import_react10.default.createElement("span", { className: "block text-xs text-gray-500 mt-1" }, feature.description)));
  })), selectedPlanPrice > 0 && DISCOUNT_CONFIG2 && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mt-4 pt-4 border-t border-gray-200" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1" }, /* @__PURE__ */ import_react10.default.createElement(Sparkles, { className: "h-3.5 w-3.5 text-amber-500" }), "\u8D2D\u4E70\u5468\u671F\u4F18\u60E0"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "space-y-2" }, [
    { qty: 12, label: "\u5E74\u4ED8", highlight: true },
    { qty: 3, label: "\u5B63\u4ED8", highlight: false },
    { qty: 1, label: "\u6708\u4ED8", highlight: false }
  ].map(({ qty, label, highlight }) => {
    const config = DISCOUNT_CONFIG2[qty];
    const rate = config?.rate || 1;
    const total = selectedPlanPrice * qty;
    const discounted = Math.round(total * rate * 100) / 100;
    const perMonth = Math.round(discounted / qty * 100) / 100;
    const save = Math.round((total - discounted) * 100) / 100;
    const bgColor = highlight ? "bg-gradient-to-r from-amber-50 to-orange-50" : qty === 3 ? "bg-anthropic-primary-50" : "bg-gray-50";
    const borderColor = highlight ? "border-2 border-amber-400" : qty === 3 ? "border border-anthropic-primary-200" : "border border-gray-200";
    return /* @__PURE__ */ import_react10.default.createElement(
      "div",
      {
        key: qty,
        className: `p-2 rounded-lg ${bgColor} ${borderColor} transition-all relative`
      },
      highlight && /* @__PURE__ */ import_react10.default.createElement("div", { className: "absolute -top-2.5 -left-2.5 z-10" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg" }, "\u6700\u5212\u7B97")),
      /* @__PURE__ */ import_react10.default.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "flex items-baseline gap-1.5" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: `font-bold ${highlight ? "text-amber-700" : qty === 3 ? "text-anthropic-primary-700" : "text-gray-700"} text-xs` }, label), config?.savePercent && /* @__PURE__ */ import_react10.default.createElement("span", { className: `text-[9px] font-semibold ${highlight ? "text-orange-600" : "text-anthropic-primary-600"}` }, config.savePercent)), /* @__PURE__ */ import_react10.default.createElement("div", { className: "flex items-baseline gap-2" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: `font-bold ${highlight ? "text-amber-700" : "text-gray-700"} text-xs` }, formatPriceWithSmallDecimal2(perMonth), "/\u6708"), save > 0 && /* @__PURE__ */ import_react10.default.createElement("span", { className: `text-[10px] font-semibold ${highlight ? "text-orange-600" : "text-green-600"}` }, "\u7701", formatPriceWithSmallDecimal2(save))))
    );
  }))));
}

// frontend/components/Toast.jsx
var import_react11 = __toESM(require_react());
function Toast({ message, onClose, duration = 3e3, type = "info" }) {
  (0, import_react11.useEffect)(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  const typeStyles = {
    info: "bg-blue-500 border-blue-600",
    warning: "bg-amber-500 border-amber-600",
    error: "bg-red-500 border-red-600",
    success: "bg-green-500 border-green-600"
  };
  return /* @__PURE__ */ import_react11.default.createElement("div", { className: "fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none" }, /* @__PURE__ */ import_react11.default.createElement(
    "div",
    {
      className: `pointer-events-auto ${typeStyles[type]} text-white px-6 py-4 rounded-lg shadow-2xl border-2 max-w-md mx-4 animate-in fade-in slide-in-from-top-4 duration-300`
    },
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "flex items-center justify-between gap-4" }, /* @__PURE__ */ import_react11.default.createElement("p", { className: "text-sm font-medium" }, message), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        onClick: onClose,
        className: "flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors",
        "aria-label": "Close"
      },
      /* @__PURE__ */ import_react11.default.createElement(X, { className: "h-4 w-4" })
    ))
  ));
}
function useToast() {
  const [toast, setToast] = import_react11.default.useState(null);
  const showToast = import_react11.default.useCallback((message, type = "info", duration = 3e3) => {
    setToast({ message, type, duration });
  }, []);
  const hideToast = import_react11.default.useCallback(() => {
    setToast(null);
  }, []);
  const ToastComponent = toast ? /* @__PURE__ */ import_react11.default.createElement(
    Toast,
    {
      message: toast.message,
      type: toast.type,
      duration: toast.duration,
      onClose: hideToast
    }
  ) : null;
  return { showToast, ToastComponent };
}

// frontend/components/pricing/PlanSections.jsx
var PlanSectionLayout = ({ featureListProps, children, className = "" }) => /* @__PURE__ */ import_react12.default.createElement("div", { className: `flex flex-col lg:flex-row gap-6 ${className} lg:items-stretch` }, /* @__PURE__ */ import_react12.default.createElement(FeatureList, { ...featureListProps }), /* @__PURE__ */ import_react12.default.createElement("div", { className: "w-full lg:w-2/3 space-y-4" }, children));
function ExperiencePlanSection({
  hiddenPlans,
  personalPrices,
  personalCredits,
  getPersonalOriginalPrice,
  personalHasDiscount,
  sora2Amount,
  setSora2Amount,
  minTopup,
  coinPackType,
  setCoinPackType,
  coinPackChecking,
  coinPackEligible,
  enterpriseCoinPackChecking,
  enterpriseCoinPackEligible,
  enterprisePlans,
  loading,
  selectedPlan,
  onPlanSelect = () => {
  },
  isAuthenticated: isAuthenticated2,
  setActivePlanTab,
  creditDisplay,
  // 新增
  showCouponInput,
  appliedCoupon,
  getQty,
  setQty,
  formatPrice: formatPrice3,
  calcBulkNumbers: calcBulkNumbers2
}) {
  const t2 = getTranslations("pricing", {});
  return /* @__PURE__ */ import_react12.default.createElement("div", { className: "flex justify-center" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "w-full max-w-sm" }, personalPlansConfig.map((plan) => {
    if (plan.id !== "claude_code_oneday") return null;
    if (hiddenPlans.has(plan.id)) {
      return /* @__PURE__ */ import_react12.default.createElement("div", { key: plan.id, className: "text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100" }, /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-gray-500" }, t2.experience?.notEligible || "\u62B1\u6B49\uFF0C\u60A8\u5F53\u524D\u4E0D\u7B26\u5408\u4F53\u9A8C\u5361\u8D2D\u4E70\u8D44\u683C\u3002"), /* @__PURE__ */ import_react12.default.createElement(
        "button",
        {
          onClick: () => setActivePlanTab("personal"),
          className: "mt-4 text-anthropic-primary font-bold hover:underline"
        },
        t2.experience?.viewMonthly || "\u67E5\u770B\u6708\u5EA6\u5957\u9910"
      ));
    }
    const basePrice = personalPrices[plan.id] ?? 0;
    const planCredits = personalCredits[plan.id] ?? 0;
    const originalPrice = getPersonalOriginalPrice(plan.id);
    const hasDiscountFlag = personalHasDiscount(plan.id);
    return /* @__PURE__ */ import_react12.default.createElement(
      FlexiblePlanCard,
      {
        key: plan.id,
        plan,
        sora2Amount,
        setSora2Amount,
        minTopup,
        coinPackType,
        setCoinPackType,
        coinPackChecking,
        coinPackEligible,
        enterpriseCoinPackChecking,
        enterpriseCoinPackEligible,
        enterprisePlans,
        loading,
        selectedPlan,
        onPlanSelect,
        isAuthenticated: isAuthenticated2,
        setActivePlanTab,
        showCouponInput,
        appliedCoupon,
        hasDiscount: hasDiscountFlag,
        originalPrice: originalPrice?.price,
        planCredits,
        getQty,
        setQty,
        formatPrice: formatPrice3,
        calcBulkNumbers: calcBulkNumbers2,
        basePrice,
        creditDisplay
      }
    );
  })));
}
function PersonalPlanSection({
  hiddenPlans,
  personalPrices,
  personalCredits,
  selectedPersonalPlan,
  setSelectedPersonalPlan,
  getQty,
  setQty,
  onPlanSelect = () => {
  },
  loading,
  selectedPlan,
  personalHasDiscount,
  getPersonalOriginalPrice,
  appliedCoupon,
  calcBulkNumbers: calcBulkNumbers2,
  formatPrice: formatPrice3,
  DISCOUNT_CONFIG: DISCOUNT_CONFIG2,
  creditDisplay
  // 新增：积分展示配置
}) {
  const getPersonalPlanComparison = () => {
    const plans = {
      "claude_code_normal": "\u5C0F\u6708\u5361",
      "claude_code_medium": "\u5927\u6708\u5361",
      "claude_code_large": "\u8D85\u5927\u6708\u5361"
    };
    const result = {};
    Object.entries(plans).forEach(([id, name]) => {
      const credits = personalCredits[id] || 0;
      const price = personalPrices[id] || 0;
      result[name] = formatCreditDisplay({ daliy_credit: credits, price }, creditDisplay);
    });
    return result;
  };
  const getPersonalPlanCardProps = (planId) => {
    const config = personalPlansConfig.find((p) => p.id === planId);
    if (!config) return null;
    return {
      plan: config,
      price: personalPrices[planId] ?? 0,
      credits: personalCredits[planId] ?? 0,
      selectedQty: getQty({ id: planId }),
      onQtyChange: (qty) => setQty({ id: planId }, qty),
      onPurchase: () => onPlanSelect({ id: planId, price: personalPrices[planId], name: config.name }),
      loading: loading && selectedPlan?.id === planId,
      hasDiscount: personalHasDiscount(planId),
      originalPrice: getPersonalOriginalPrice(planId),
      appliedCoupon,
      calcBulkNumbers: calcBulkNumbers2,
      formatPrice: formatPrice3,
      DISCOUNT_CONFIG: DISCOUNT_CONFIG2,
      onCardClick: (id) => setSelectedPersonalPlan(id),
      isSelected: planId === selectedPersonalPlan,
      creditDisplay
      // 新增：传递配置
    };
  };
  return /* @__PURE__ */ import_react12.default.createElement("div", { className: "flex justify-center" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "w-full max-w-2xl" }, /* @__PURE__ */ import_react12.default.createElement(
    FlexibleTopupCard,
    {
      loading,
      selectedPlan,
      onPlanSelect
    }
  )));
}
function EnterprisePlanSection({
  enterprisePlans,
  enterprisePrices,
  selectedEnterprisePlan,
  setSelectedEnterprisePlan,
  getQty,
  setQty,
  onPlanSelect = () => {
  },
  loading,
  selectedPlan,
  enterpriseHasDiscount,
  getEnterpriseOriginalPrice,
  appliedCoupon,
  calcBulkNumbers: calcBulkNumbers2,
  formatPrice: formatPrice3,
  DISCOUNT_CONFIG: DISCOUNT_CONFIG2
}) {
  const getEnterprisePlanComparison = () => ({
    "\u5C0F\u56E2\u961F\u7248": "25,000 \u79EF\u5206/\u5929 | 3-8\u4EBA",
    "\u6210\u957F\u56E2\u961F\u7248": "70,000 \u79EF\u5206/\u5929 | 8-15\u4EBA",
    "\u4F01\u4E1A\u7248": "150,000 \u79EF\u5206/\u5929 | 15+\u4EBA"
  });
  const findEnterprisePlan = (id) => enterprisePlans.find((plan) => plan.id === id);
  const getEnterprisePlanForUI = (id, fallbackPrice, fallbackName) => {
    const plan = findEnterprisePlan(id);
    if (plan) return plan;
    return {
      id,
      price: fallbackPrice,
      name: fallbackName
    };
  };
  const getEnterprisePlanCardProps = (planId, plan, price, credits) => ({
    plan: { ...plan, id: planId },
    price,
    credits,
    selectedQty: getQty(plan),
    onQtyChange: (qty) => setQty(plan, qty),
    onPurchase: () => onPlanSelect(plan),
    loading: loading && selectedPlan?.id === planId,
    hasDiscount: enterpriseHasDiscount(planId),
    originalPrice: getEnterpriseOriginalPrice(planId),
    appliedCoupon,
    calcBulkNumbers: calcBulkNumbers2,
    formatPrice: formatPrice3,
    DISCOUNT_CONFIG: DISCOUNT_CONFIG2,
    onCardClick: (id) => setSelectedEnterprisePlan(id),
    isSelected: planId === selectedEnterprisePlan
  });
  const enterpriseStarterPlan = getEnterprisePlanForUI("enterprise_starter", enterprisePrices["enterprise_starter"] ?? 0, "\u5C0F\u56E2\u961F\u7248");
  const enterpriseGrowthPlan = getEnterprisePlanForUI("enterprise_growth", enterprisePrices["enterprise_growth"] ?? 0, "\u6210\u957F\u56E2\u961F\u7248");
  const enterpriseScalePlan = getEnterprisePlanForUI("enterprise_scale", enterprisePrices["enterprise_scale"] ?? 0, "\u4F01\u4E1A\u7248");
  const enterpriseStarterPrice = typeof enterpriseStarterPlan.price === "number" ? enterpriseStarterPlan.price : enterprisePrices["enterprise_starter"] ?? 0;
  const enterpriseGrowthPrice = typeof enterpriseGrowthPlan.price === "number" ? enterpriseGrowthPlan.price : enterprisePrices["enterprise_growth"] ?? 0;
  const enterpriseScalePrice = typeof enterpriseScalePlan.price === "number" ? enterpriseScalePlan.price : enterprisePrices["enterprise_scale"] ?? 0;
  return /* @__PURE__ */ import_react12.default.createElement(
    PlanSectionLayout,
    {
      className: "mb-8",
      featureListProps: {
        title: "\u4F01\u4E1A\u7EA7\u529F\u80FD",
        features: enterprisePlanFeatures,
        comparisonData: getEnterprisePlanComparison(),
        selectedPlanId: selectedEnterprisePlan,
        selectedPlanName: selectedEnterprisePlan === "enterprise_starter" ? "\u5C0F\u56E2\u961F\u7248" : selectedEnterprisePlan === "enterprise_growth" ? "\u6210\u957F\u56E2\u961F\u7248" : "\u4E13\u4E1A\u7248(Pro+)",
        selectedPlanCredits: selectedEnterprisePlan === "enterprise_starter" ? 25e3 : selectedEnterprisePlan === "enterprise_growth" ? 7e4 : 15e4,
        selectedPlanPrice: enterprisePrices[selectedEnterprisePlan] || 0,
        DISCOUNT_CONFIG: DISCOUNT_CONFIG2
      }
    },
    /* @__PURE__ */ import_react12.default.createElement(PlanOptionCard, { ...getEnterprisePlanCardProps(
      "enterprise_starter",
      { ...enterpriseStarterPlan, name: "\u5C0F\u56E2\u961F\u7248", description: "\u4E13\u4E3A\u521D\u521B\u56E2\u961F\u5B9A\u5236", popular: false },
      enterpriseStarterPrice,
      25e3
    ) }),
    /* @__PURE__ */ import_react12.default.createElement(PlanOptionCard, { ...getEnterprisePlanCardProps(
      "enterprise_growth",
      { id: "enterprise_growth", name: "\u6210\u957F\u56E2\u961F\u7248", description: "\u9002\u5408\u4E2D\u578B\u56E2\u961F", popular: false },
      enterpriseGrowthPrice,
      7e4
    ) }),
    /* @__PURE__ */ import_react12.default.createElement(PlanOptionCard, { ...getEnterprisePlanCardProps(
      "enterprise_scale",
      { ...enterpriseScalePlan, name: "\u4E13\u4E1A\u7248(Pro+)", description: "\u5927\u89C4\u6A21\u56E2\u961F\u89E3\u51B3\u65B9\u6848", popular: true },
      enterpriseScalePrice,
      15e4
    ) })
  );
}
function FlexiblePlanSection({
  hiddenPlans,
  personalPrices,
  personalCredits,
  getPersonalOriginalPrice,
  personalHasDiscount,
  sora2Amount,
  setSora2Amount,
  minTopup,
  coinPackType,
  setCoinPackType,
  coinPackChecking,
  coinPackEligible,
  enterpriseCoinPackChecking,
  enterpriseCoinPackEligible,
  enterprisePlans,
  loading,
  selectedPlan,
  onPlanSelect = () => {
  },
  isAuthenticated: isAuthenticated2,
  setActivePlanTab,
  creditDisplay,
  // 新增
  showCouponInput,
  appliedCoupon,
  getQty,
  setQty,
  formatPrice: formatPrice3,
  calcBulkNumbers: calcBulkNumbers2,
  selectedPermanentBundle,
  onBundleSelect,
  permanentCreditBundles,
  onPermanentContact,
  onPermanentPurchase
}) {
  return /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("div", { className: `grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 ${FEATURES.VIDEO_POINTS_ENABLED ? "lg:grid-cols-4" : "lg:grid-cols-3 max-w-5xl mx-auto"}` }, personalPlansConfig.map((plan) => {
    const allowedIds = ["claude_code_oneday", "claude_code_coin_pack"];
    if (FEATURES.VIDEO_POINTS_ENABLED) {
      allowedIds.push("sora2");
    }
    if (!allowedIds.includes(plan.id)) {
      return null;
    }
    if (hiddenPlans.has(plan.id)) {
      return null;
    }
    let basePrice;
    if (plan.customAmountInput === "sora2") {
      basePrice = Number(sora2Amount || minTopup);
    } else {
      basePrice = personalPrices[plan.id] ?? 0;
    }
    const planCredits = personalCredits[plan.id] ?? 0;
    const originalPrice = getPersonalOriginalPrice(plan.id);
    const hasDiscountFlag = personalHasDiscount(plan.id);
    return /* @__PURE__ */ import_react12.default.createElement(
      FlexiblePlanCard,
      {
        key: plan.id,
        plan,
        sora2Amount,
        setSora2Amount,
        minTopup,
        coinPackType,
        setCoinPackType,
        coinPackChecking,
        coinPackEligible,
        enterpriseCoinPackChecking,
        enterpriseCoinPackEligible,
        enterprisePlans,
        loading,
        selectedPlan,
        onPlanSelect,
        isAuthenticated: isAuthenticated2,
        setActivePlanTab,
        showCouponInput,
        appliedCoupon,
        hasDiscount: hasDiscountFlag,
        originalPrice: originalPrice?.price,
        planCredits,
        getQty,
        setQty,
        formatPrice: formatPrice3,
        calcBulkNumbers: calcBulkNumbers2,
        basePrice,
        creditDisplay
      }
    );
  }), /* @__PURE__ */ import_react12.default.createElement(
    TokenCard,
    {
      selectedBundle: selectedPermanentBundle,
      onBundleSelect,
      bundles: permanentCreditBundles,
      onContact: onPermanentContact,
      onPurchase: onPermanentPurchase,
      loading,
      selectedPlanId: selectedPlan?.id
    }
  )), /* @__PURE__ */ import_react12.default.createElement(
    SubscriptionPlansSection,
    {
      onPlanSelect,
      formatPrice: formatPrice3
    }
  ));
}
function SubscriptionPlansSection({ onPlanSelect, formatPrice: formatPrice3 }) {
  const { showToast, ToastComponent } = useToast();
  const [billingCycle, setBillingCycle] = (0, import_react12.useState)("monthly");
  const claudeMeta = getModelConsumptionMeta(null, "claude");
  const subscriptionPlans = [
    {
      id: "basic",
      name: "\u57FA\u7840\u7248",
      nameEn: "Basic",
      monthlyPrice: 69,
      dailyQuota: 5,
      features: [
        "\u6BCF\u65E5\u81EA\u52A8\u53D1\u653E $26.3 \u989D\u5EA6",
        "\u989D\u5EA6\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6",
        "\u9002\u5408\u8F7B\u5EA6\u4F7F\u7528\u573A\u666F",
        "\u652F\u6301\u6240\u6709 Claude \u6A21\u578B"
      ],
      highlight: false
    },
    {
      id: "pro",
      name: "\u4E13\u4E1A\u7248",
      nameEn: "Pro",
      monthlyPrice: 99,
      dailyQuota: 10,
      features: [
        "\u6BCF\u65E5\u81EA\u52A8\u53D1\u653E $52.6 \u989D\u5EA6",
        "\u989D\u5EA6\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6",
        "\u9002\u5408\u65E5\u5E38\u5F00\u53D1\u4F7F\u7528",
        "\u652F\u6301\u6240\u6709 Claude \u6A21\u578B",
        "\u4F18\u5148\u6280\u672F\u652F\u6301"
      ],
      highlight: true
    },
    {
      id: "flagship",
      name: "\u65D7\u8230\u7248",
      nameEn: "Flagship",
      monthlyPrice: 169,
      dailyQuota: 20,
      features: [
        "\u6BCF\u65E5\u81EA\u52A8\u53D1\u653E $105.2 \u989D\u5EA6",
        "\u989D\u5EA6\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6",
        "\u9002\u5408\u91CD\u5EA6\u4F7F\u7528\u573A\u666F",
        "\u652F\u6301\u6240\u6709 Claude \u6A21\u578B",
        "\u4F18\u5148\u6280\u672F\u652F\u6301",
        "\u4E13\u5C5E\u5BA2\u6237\u7ECF\u7406"
      ],
      highlight: false
    }
  ];
  const calculatePrice = (monthlyPrice) => {
    if (billingCycle === "quarterly") {
      return monthlyPrice * 3 * 0.905;
    } else if (billingCycle === "yearly") {
      return monthlyPrice * 12 * 0.915;
    }
    return monthlyPrice;
  };
  const calculateActualUsage = (dailyQuota) => {
    return calculateModelUsageEquivalent(dailyQuota, claudeMeta.discount).toFixed(2);
  };
  const getCycleText = () => {
    if (billingCycle === "quarterly") return "\u5B63\u4ED8";
    if (billingCycle === "yearly") return "\u5E74\u4ED8";
    return "\u6708\u4ED8";
  };
  const getCycleMultiplier = () => {
    if (billingCycle === "quarterly") return 3;
    if (billingCycle === "yearly") return 12;
    return 1;
  };
  return /* @__PURE__ */ import_react12.default.createElement(import_react12.default.Fragment, null, /* @__PURE__ */ import_react12.default.createElement("div", { className: "mt-16" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-center mb-12" }, /* @__PURE__ */ import_react12.default.createElement("h2", { className: "text-3xl font-bold text-gray-900 mb-4" }, "\u8D85\u503C\u8BA2\u9605\uFF0C\u6BCF\u65E5\u53D1\u653E"), /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-lg text-gray-600" }, "\u9009\u62E9\u8BA2\u9605\u5957\u9910\uFF0C\u6BCF\u65E5\u81EA\u52A8\u53D1\u653E\u989D\u5EA6\uFF0C\u7A33\u5B9A\u53EF\u9760")), /* @__PURE__ */ import_react12.default.createElement("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ import_react12.default.createElement("svg", { className: "w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react12.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })), /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("h3", { className: "text-lg font-semibold text-blue-900 mb-2" }, "\u8BA2\u9605\u5957\u9910\u8BF4\u660E"), /* @__PURE__ */ import_react12.default.createElement("ul", { className: "text-blue-800 space-y-1" }, /* @__PURE__ */ import_react12.default.createElement("li", null, "\u2022 \u6BCF\u65E5\u81EA\u52A8\u53D1\u653E\u989D\u5EA6\uFF0C\u65E0\u9700\u624B\u52A8\u5145\u503C"), /* @__PURE__ */ import_react12.default.createElement("li", null, "\u2022 \u989D\u5EA6\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6\uFF0C\u4E0D\u7D2F\u8BA1"), /* @__PURE__ */ import_react12.default.createElement("li", null, "\u2022 \u5B63\u4ED8\u4EAB 9.5 \u6298\u4F18\u60E0\uFF0C\u5E74\u4ED8\u4EAB 8.5 \u6298\u4F18\u60E0"))))), /* @__PURE__ */ import_react12.default.createElement("div", { className: "flex justify-center mb-8" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "inline-flex rounded-lg border border-gray-300 p-1 bg-white" }, /* @__PURE__ */ import_react12.default.createElement(
    "button",
    {
      onClick: () => setBillingCycle("monthly"),
      className: `px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-blue-600 text-white" : "text-gray-700 hover:text-gray-900"}`
    },
    "\u6708\u4ED8"
  ), /* @__PURE__ */ import_react12.default.createElement(
    "button",
    {
      onClick: () => setBillingCycle("quarterly"),
      className: `px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === "quarterly" ? "bg-blue-600 text-white" : "text-gray-700 hover:text-gray-900"}`
    },
    "\u5B63\u4ED8 ",
    /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-xs" }, "(9.5\u6298)")
  ), /* @__PURE__ */ import_react12.default.createElement(
    "button",
    {
      onClick: () => setBillingCycle("yearly"),
      className: `px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === "yearly" ? "bg-blue-600 text-white" : "text-gray-700 hover:text-gray-900"}`
    },
    "\u5E74\u4ED8 ",
    /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-xs" }, "(8.5\u6298)")
  ))), /* @__PURE__ */ import_react12.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" }, subscriptionPlans.map((plan) => {
    const totalPrice = calculatePrice(plan.monthlyPrice);
    const actualUsage = calculateActualUsage(plan.dailyQuota);
    const cycleMultiplier = getCycleMultiplier();
    return /* @__PURE__ */ import_react12.default.createElement(
      "div",
      {
        key: plan.id,
        className: `relative rounded-2xl border-2 p-8 ${plan.highlight ? "border-blue-600 shadow-xl scale-105" : "border-gray-200 hover:border-blue-300"} transition-all duration-200`
      },
      plan.highlight && /* @__PURE__ */ import_react12.default.createElement("div", { className: "absolute -top-4 left-1/2 transform -translate-x-1/2" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold" }, "\u63A8\u8350")),
      /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ import_react12.default.createElement("h3", { className: "text-2xl font-bold text-gray-900 mb-2" }, t.productNames?.[plan.id] || plan.name), /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-gray-500" }, plan.nameEn)),
      /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-center mb-6 pb-6 border-b border-gray-200" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "flex items-baseline justify-center mb-2" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-4xl font-bold text-gray-900" }, "$", totalPrice.toFixed(0)), /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-gray-500 ml-2" }, "/ ", getCycleText())), billingCycle !== "monthly" && /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-sm text-green-600 font-medium" }, "\u8282\u7701 $", (plan.monthlyPrice * cycleMultiplier - totalPrice).toFixed(0))),
      /* @__PURE__ */ import_react12.default.createElement("div", { className: "bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-center" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-sm text-gray-600 mb-1" }, "\u6BCF\u65E5\u53EF\u7528"), /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-3xl font-bold text-blue-600 mb-2" }, "$", plan.dailyQuota), /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-xs text-gray-500 mb-3" }, "\u989D\u5EA6\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6"), /* @__PURE__ */ import_react12.default.createElement("div", { className: "border-t border-blue-200 pt-3" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-sm font-semibold text-gray-700 mb-1" }, "Claude \u5B9E\u9645\u53EF\u7528"), /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-2xl font-bold text-purple-600" }, "$", actualUsage), /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-xs text-gray-500 mt-1" }, "\u5957\u9910\u4EF7\u683C \xF7 ", claudeMeta.discountText, " = \u5B9E\u9645\u53EF\u6D88\u8017")))),
      /* @__PURE__ */ import_react12.default.createElement("ul", { className: "space-y-3 mb-8" }, plan.features.map((feature, index) => /* @__PURE__ */ import_react12.default.createElement("li", { key: index, className: "flex items-start" }, /* @__PURE__ */ import_react12.default.createElement(
        "svg",
        {
          className: "w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        },
        /* @__PURE__ */ import_react12.default.createElement(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M5 13l4 4L19 7"
          }
        )
      ), /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-gray-700 text-sm" }, feature)))),
      /* @__PURE__ */ import_react12.default.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ import_react12.default.createElement(
        "button",
        {
          onClick: () => showToast("\u8BE5\u529F\u80FD\u6682\u672A\u5F00\u653E\uFF0C\u656C\u8BF7\u671F\u5F85", "warning"),
          className: `w-full py-3 px-6 font-semibold transition-colors cursor-pointer ${plan.highlight ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`
        },
        "\u9009\u62E9\u5957\u9910"
      ), /* @__PURE__ */ import_react12.default.createElement("div", { className: "text-center text-xs text-gray-500 font-mono" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-amber-600" }, ">"), " status: ", /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-amber-600" }, "[PENDING]"), " \u5957\u9910\u5F00\u53D1\u4E2D..."))
    );
  })), /* @__PURE__ */ import_react12.default.createElement("div", { className: "bg-white rounded-xl border border-gray-200 overflow-hidden mb-12" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4" }, /* @__PURE__ */ import_react12.default.createElement("h3", { className: "text-xl font-bold text-white" }, "\u8BA2\u9605 vs \u5145\u503C\u5BF9\u6BD4")), /* @__PURE__ */ import_react12.default.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ import_react12.default.createElement("table", { className: "w-full" }, /* @__PURE__ */ import_react12.default.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ import_react12.default.createElement("tr", null, /* @__PURE__ */ import_react12.default.createElement("th", { className: "px-6 py-4 text-left text-sm font-semibold text-gray-900" }, "\u5BF9\u6BD4\u9879"), /* @__PURE__ */ import_react12.default.createElement("th", { className: "px-6 py-4 text-left text-sm font-semibold text-gray-900" }, "\u8BA2\u9605\u5957\u9910"), /* @__PURE__ */ import_react12.default.createElement("th", { className: "px-6 py-4 text-left text-sm font-semibold text-gray-900" }, "\u7075\u6D3B\u5145\u503C"))), /* @__PURE__ */ import_react12.default.createElement("tbody", { className: "divide-y divide-gray-200" }, /* @__PURE__ */ import_react12.default.createElement("tr", null, /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-900 font-medium" }, "\u4ED8\u8D39\u65B9\u5F0F"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u6309\u6708/\u5B63/\u5E74\u8BA2\u9605"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u6309\u9700\u5145\u503C")), /* @__PURE__ */ import_react12.default.createElement("tr", { className: "bg-gray-50" }, /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-900 font-medium" }, "\u989D\u5EA6\u53D1\u653E"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u6BCF\u65E5\u81EA\u52A8\u53D1\u653E"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u4E00\u6B21\u6027\u5230\u8D26")), /* @__PURE__ */ import_react12.default.createElement("tr", null, /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-900 font-medium" }, "\u989D\u5EA6\u6709\u6548\u671F"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u6C38\u4E45\u6709\u6548")), /* @__PURE__ */ import_react12.default.createElement("tr", { className: "bg-gray-50" }, /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-900 font-medium" }, "\u4EF7\u683C\u4F18\u52BF"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-green-600 font-semibold" }, "\u5B63\u4ED89.5\u6298\uFF0C\u5E74\u4ED88.5\u6298")), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u5145\u503C\u8D8A\u591A\u6298\u6263\u8D8A\u5927")), /* @__PURE__ */ import_react12.default.createElement("tr", null, /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-900 font-medium" }, "\u9002\u7528\u573A\u666F"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u7A33\u5B9A\u7684\u65E5\u5E38\u4F7F\u7528"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, "\u7075\u6D3B\u7684\u6309\u9700\u4F7F\u7528")), /* @__PURE__ */ import_react12.default.createElement("tr", { className: "bg-gray-50" }, /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-900 font-medium" }, "\u4F01\u4E1A\u529F\u80FD"), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-red-600" }, "\u4E0D\u5305\u542B")), /* @__PURE__ */ import_react12.default.createElement("td", { className: "px-6 py-4 text-sm text-gray-700" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "text-green-600" }, "\u5305\u542B\uFF08$20\u6863\u4F4D\u53CA\u4EE5\u4E0A\uFF09"))))))), /* @__PURE__ */ import_react12.default.createElement("div", { className: "bg-gray-50 rounded-xl p-8" }, /* @__PURE__ */ import_react12.default.createElement("h3", { className: "text-2xl font-bold text-gray-900 mb-6 text-center" }, "\u5E38\u89C1\u95EE\u9898"), /* @__PURE__ */ import_react12.default.createElement("div", { className: "space-y-6 max-w-3xl mx-auto" }, /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("h4", { className: "font-semibold text-gray-900 mb-2" }, "Q: \u8BA2\u9605\u5957\u9910\u7684\u989D\u5EA6\u5982\u4F55\u53D1\u653E\uFF1F"), /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-gray-700" }, "A: \u6BCF\u5929\u81EA\u52A8\u53D1\u653E\u5230\u60A8\u7684\u8D26\u6237\uFF0C\u65E0\u9700\u624B\u52A8\u64CD\u4F5C\u3002\u989D\u5EA6\u5728\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6\uFF0C\u4E0D\u7D2F\u8BA1\u3002")), /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("h4", { className: "font-semibold text-gray-900 mb-2" }, "Q: \u8BA2\u9605\u5957\u9910\u5305\u542B\u4F01\u4E1A\u7248\u529F\u80FD\u5417\uFF1F"), /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-gray-700" }, "A: \u4E0D\u5305\u542B\u3002\u5982\u9700\u4F01\u4E1A\u7248\u529F\u80FD\uFF08\u5982\u56E2\u961F\u7BA1\u7406\u3001API\u8BBF\u95EE\u7B49\uFF09\uFF0C\u8BF7\u9009\u62E9\u7075\u6D3B\u5145\u503C\u7684 $20 \u6863\u4F4D\u53CA\u4EE5\u4E0A\uFF0C\u6216\u8054\u7CFB\u5BA2\u670D\u54A8\u8BE2\u4F01\u4E1A\u65B9\u6848\u3002")), /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("h4", { className: "font-semibold text-gray-900 mb-2" }, "Q: \u5982\u4F55\u8BA1\u7B97 Claude \u5B9E\u9645\u53EF\u7528\u989D\u5EA6\uFF1F"), /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-gray-700" }, "A: \u4F7F\u7528\u516C\u5F0F\uFF1A\u5957\u9910\u4EF7\u683C \xF7 ", claudeMeta.discountText, " = \u5B9E\u9645\u53EF\u6D88\u8017\u3002\u4F8B\u5982\u57FA\u7840\u7248\u6BCF\u65E5 $5\uFF0C\u5B9E\u9645\u53EF\u7528\u7EA6 $26.32 \u7684 Claude \u670D\u52A1\u3002")), /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("h4", { className: "font-semibold text-gray-900 mb-2" }, "Q: \u53EF\u4EE5\u968F\u65F6\u53D6\u6D88\u8BA2\u9605\u5417\uFF1F"), /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-gray-700" }, "A: \u53EF\u4EE5\u3002\u60A8\u53EF\u4EE5\u968F\u65F6\u53D6\u6D88\u8BA2\u9605\uFF0C\u5DF2\u652F\u4ED8\u7684\u5468\u671F\u4F1A\u7EE7\u7EED\u670D\u52A1\u81F3\u5230\u671F\u3002")), /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("h4", { className: "font-semibold text-gray-900 mb-2" }, "Q: \u8BA2\u9605\u548C\u5145\u503C\u53EF\u4EE5\u540C\u65F6\u4F7F\u7528\u5417\uFF1F"), /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-gray-700" }, "A: \u53EF\u4EE5\u3002\u8BA2\u9605\u5957\u9910\u548C\u7075\u6D3B\u5145\u503C\u53EF\u4EE5\u540C\u65F6\u4F7F\u7528\uFF0C\u989D\u5EA6\u4F1A\u81EA\u52A8\u53E0\u52A0\u3002"))))), ToastComponent);
}

// frontend/components/pricing/EnterpriseBenefitsCard.jsx
var import_react13 = __toESM(require_react());

// frontend/components/pricing/TopupTierCard.jsx
var import_react14 = __toESM(require_react());
var TOPUP_TIERS = [
  {
    id: "pool_promo",
    amount: 1234,
    cnyPrice: 8888,
    bonus: 0,
    bonusPercent: "0%",
    label: "Pool \u4FC3\u9500\u5305",
    description: "\u4EC5\u9650 Pool \u8D44\u6E90\u6C60\uFF08Claude\uFF09\xB7 90\u5929\u6709\u6548",
    included: ["1.39\u6298\u6D88\u8017\uFF08\u5E38\u89C42.9\u6298\uFF09", "\u8282\u7701\u8D8552%", "Pool \u8D44\u6E90\u6C60\u4E13\u7528", "90\u5929\u6709\u6548\u671F"],
    features: { apiKeys: 1, concurrency: 1, dailyLimit: "\u4F4E", stability: "\u666E\u901A", enterpriseDays: 0 },
    targetUser: "\u4FC3\u9500\u4F53\u9A8C",
    isEnterprise: false,
    recommended: false,
    isPromo: true,
    promoDiscount: "1.39",
    promoNormalDiscount: "2.9",
    promoSavePercent: "52%"
  },
  {
    id: "tier_10",
    amount: 13.88,
    bonus: 0,
    bonusPercent: "0%",
    label: "\u5165\u95E8\u8BD5\u9519",
    description: "\u4F4E\u6210\u672C\u4F53\u9A8C\uFF0C\u7528\u4E8E\u529F\u80FD\u9A8C\u8BC1\u4E0E Demo",
    included: ["1 \u4E2A API Key", "1 \u5E76\u53D1", "\u57FA\u7840\u7A33\u5B9A\u6027"],
    features: { apiKeys: 1, concurrency: 1, dailyLimit: "\u4F4E", stability: "\u666E\u901A", enterpriseDays: 0 },
    targetUser: "\u8BD5\u9519",
    isEnterprise: false,
    recommended: false
  },
  {
    id: "tier_50",
    amount: 55.88,
    cnyPrice: 399,
    bonus: 0,
    bonusPercent: "0%",
    label: "\u4E2A\u4EBA\u7528\u6237",
    description: "\u9002\u5408\u4E2A\u4EBA\u5F00\u53D1\u8005\u7684\u65E5\u5E38\u4F7F\u7528",
    included: ["1 \u4E2A API Key", "1 \u5E76\u53D1", "\u57FA\u7840\u7A33\u5B9A\u6027"],
    features: { apiKeys: 1, concurrency: 1, dailyLimit: "\u4E2D", stability: "\u666E\u901A", enterpriseDays: 0 },
    targetUser: "\u4E2A\u4EBA",
    isEnterprise: false,
    recommended: false
  },
  {
    id: "tier_100",
    amount: 111.88,
    cnyPrice: 799,
    bonus: 0,
    bonusPercent: "0%",
    label: "\u4E2A\u4EBA\u8FDB\u9636",
    description: "\u4E2A\u4EBA\u5F00\u53D1\u8005\u7684\u8FDB\u9636\u9009\u62E9",
    included: ["1 \u4E2A API Key", "3 \u5E76\u53D1", "\u57FA\u7840\u7A33\u5B9A\u6027"],
    features: { apiKeys: 1, concurrency: 3, dailyLimit: "\u8F83\u9AD8", stability: "\u666E\u901A", enterpriseDays: 0 },
    targetUser: "\u4E2A\u4EBA\u8FDB\u9636",
    isEnterprise: false,
    recommended: true
  },
  {
    id: "tier_500",
    amount: 500,
    bonus: 0,
    bonusPercent: "0%",
    label: "\u6210\u957F\u56E2\u961F\u7248",
    description: "\u9AD8\u5E76\u53D1\u9700\u6C42\u6216\u5C0F\u89C4\u6A21\u56E2\u961F",
    included: ["10 \u4E2A API Key", "10 \u5E76\u53D1", "\u66F4\u9AD8\u7A33\u5B9A\u6027", "\u4F01\u4E1A\u6743\u9650 60 \u5929"],
    features: { apiKeys: 10, concurrency: 10, dailyLimit: "\u5F88\u9AD8", stability: "\u66F4\u9AD8", enterpriseDays: 60 },
    targetUser: "\u6210\u957F\u56E2\u961F",
    isEnterprise: true,
    recommended: false
  },
  {
    id: "tier_1000",
    amount: 1e3,
    bonus: 0,
    bonusPercent: "0%",
    label: "\u6807\u51C6\u4F01\u4E1A\u7248",
    description: "\u6B63\u5F0F\u4F01\u4E1A\u7528\u6237\u4E0E\u751F\u4EA7\u73AF\u5883",
    included: ["30 \u4E2A API Key", "\u9AD8\u5E76\u53D1", "\u6700\u9AD8\u7A33\u5B9A\u6027", "\u4F01\u4E1A\u6743\u9650 90 \u5929", "\u72EC\u7ACB\u8D44\u6E90\u6C60", "SLA \u4FDD\u969C"],
    features: { apiKeys: 30, concurrency: "\u9AD8", dailyLimit: "\u6781\u9AD8", stability: "\u6700\u9AD8", enterpriseDays: 90, stablePool: true, sla: true },
    targetUser: "\u4F01\u4E1A",
    isEnterprise: true,
    recommended: false
  },
  {
    id: "tier_1500",
    amount: 1500,
    bonus: 0,
    bonusPercent: "0%",
    label: "\u4F01\u4E1A\u589E\u5F3A\u7248",
    description: "\u66F4\u5927\u989D\u5EA6\uFF0C\u9002\u5408\u4E2D\u578B\u56E2\u961F",
    included: ["50 \u4E2A API Key", "\u5F88\u9AD8\u5E76\u53D1", "\u6700\u9AD8\u7A33\u5B9A\u6027", "\u4F01\u4E1A\u6743\u9650 120 \u5929", "\u72EC\u7ACB\u8D44\u6E90\u6C60", "SLA \u4FDD\u969C"],
    features: { apiKeys: 50, concurrency: "\u5F88\u9AD8", dailyLimit: "\u6781\u9AD8", stability: "\u6700\u9AD8", enterpriseDays: 120, stablePool: true, sla: true },
    targetUser: "\u4E2D\u578B\u4F01\u4E1A",
    isEnterprise: true,
    recommended: false
  },
  {
    id: "tier_3000",
    amount: 3e3,
    bonus: 0,
    bonusPercent: "0%",
    label: "\u5927\u89C4\u6A21\u89E3\u51B3\u65B9\u6848",
    description: "\u5927\u578B\u4F01\u4E1A\u4E0E\u9AD8\u9891\u751F\u4EA7\u73AF\u5883",
    included: ["100 \u4E2A API Key", "\u6781\u9AD8\u5E76\u53D1", "\u6700\u9AD8\u7A33\u5B9A\u6027", "\u4F01\u4E1A\u6743\u9650 180 \u5929", "\u72EC\u7ACB\u8D44\u6E90\u6C60", "SLA \u4FDD\u969C", "\u4E13\u5C5E\u6280\u672F\u652F\u6301"],
    features: { apiKeys: 100, concurrency: "\u6781\u9AD8", dailyLimit: "\u65E0\u9650", stability: "\u6700\u9AD8", enterpriseDays: 180, stablePool: true, sla: true, dedicatedSupport: true },
    targetUser: "\u5927\u578B\u4F01\u4E1A",
    isEnterprise: true,
    recommended: false
  }
];
function getTopupTiersWithPromotion(promotionConfig) {
  return applyBundleGift(applyMaydayBonus(TOPUP_TIERS, promotionConfig?.mayday), promotionConfig?.bundle_gift);
}
var BUNDLE_GIFT_OFFICIAL_URL = {
  zh: "https://www.beatsbydre.com.cn/earbuds/powerbeats-pro-2",
  en: "https://www.beatsbydre.com/earbuds/powerbeats-pro-2"
};
function getBundleGiftOfficialUrl() {
  const isEn = typeof window !== "undefined" && window.location.pathname.startsWith("/en");
  return isEn ? BUNDLE_GIFT_OFFICIAL_URL.en : BUNDLE_GIFT_OFFICIAL_URL.zh;
}
function BundleGiftNameLink({ name, title }) {
  return /* @__PURE__ */ import_react14.default.createElement(
    "a",
    {
      href: getBundleGiftOfficialUrl(),
      target: "_blank",
      rel: "noopener noreferrer",
      title,
      onClick: (e) => e.stopPropagation(),
      onKeyDown: (e) => e.stopPropagation(),
      className: "underline decoration-dotted underline-offset-2 hover:brightness-110"
    },
    name
  );
}
function applyBundleGift(tiers, bundleGift) {
  if (!bundleGift?.active || !bundleGift?.tiers?.length) {
    return tiers;
  }
  const qtyMap = {};
  for (const tier of bundleGift.tiers) {
    qtyMap[tier.amount] = tier.quantity;
  }
  return tiers.map((tier) => {
    const quantity = qtyMap[tier.amount];
    if (!quantity) return tier;
    return {
      ...tier,
      bundleGift: {
        name: bundleGift.gift_name,
        image: bundleGift.gift_image,
        retailPriceCny: bundleGift.retail_price_cny,
        quantity
      }
    };
  });
}
function applyMaydayBonus(tiers, mayday) {
  if (!mayday?.active || !mayday?.bonus_tiers?.length) {
    return tiers;
  }
  const bonusMap = {};
  for (const tier of mayday.bonus_tiers) {
    bonusMap[tier.amount] = tier.bonus;
  }
  return tiers.map((tier) => {
    const maydayBonus = bonusMap[tier.amount];
    if (maydayBonus != null && maydayBonus > 0) {
      return {
        ...tier,
        bonus: maydayBonus,
        bonusPercent: `${Math.round(maydayBonus / tier.amount * 100)}%`,
        maydayBonus
      };
    }
    return tier;
  });
}
function TopupTierCard({ tier, loading, onSelect, isSelected }) {
  const t2 = getTranslations("pricing", {});
  const isLoading = loading && isSelected;
  const [isHovered, setIsHovered] = (0, import_react14.useState)(false);
  const baseTransform = isHovered ? tier.recommended ? "translateY(-8px) scale(1.04)" : "translateY(-6px) scale(1.03)" : "translateY(0) scale(1)";
  const baseShadow = tier.recommended ? "0 0 0 1px rgba(0, 170, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 24px rgba(0, 170, 0, 0.3)" : "none";
  const hoverShadow = tier.recommended ? "0 0 0 1px rgba(0, 170, 0, 0.65), 0 10px 30px rgba(0, 0, 0, 0.55), 0 0 36px rgba(0, 170, 0, 0.4), inset 0 0 36px rgba(0, 170, 0, 0.1)" : "0 0 0 1px rgba(0, 170, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 28px rgba(0, 170, 0, 0.28), inset 0 0 32px rgba(0, 170, 0, 0.08)";
  return /* @__PURE__ */ import_react14.default.createElement(
    "div",
    {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onClick: () => {
        if (isLoading) return;
        onSelect(tier);
      },
      role: "button",
      tabIndex: 0,
      onKeyDown: (e) => {
        if (isLoading) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(tier);
        }
      },
      className: `topup-tier-card relative flex flex-col border p-6 bg-[#0f1311] cursor-pointer ${tier.recommended ? "border-[var(--term-primary)] topup-tier-card--recommended" : "border-[var(--term-muted)]"}`,
      style: {
        backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,170,0,0.05) 0px, rgba(0,170,0,0.05) 1px, transparent 1px, transparent 4px)",
        transform: baseTransform,
        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, border-color 0.2s ease",
        boxShadow: isHovered ? hoverShadow : baseShadow,
        borderColor: isHovered ? "var(--term-primary)" : void 0,
        zIndex: isHovered ? 5 : 1,
        animation: isHovered ? "tier-card-shake 0.45s ease-in-out" : "none",
        willChange: "transform"
      }
    },
    tier.bundleGift ? /* @__PURE__ */ import_react14.default.createElement(
      "div",
      {
        className: "absolute -top-2 -right-2 bg-gradient-to-br from-[#cc8a00] to-[#ff6b00] text-white text-xs font-bold px-3 py-1.5 shadow-lg transform rotate-3 z-10",
        style: {
          boxShadow: "0 4px 12px rgba(204, 138, 0, 0.4)",
          borderRadius: "4px",
          letterSpacing: "0.5px",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }
      },
      "\u{1F3A7} ",
      t2.topupTiers?.giftBadge || "\u9001\u8033\u673A"
    ) : tier.maydayBonus > 0 && /* @__PURE__ */ import_react14.default.createElement(
      "div",
      {
        className: "absolute -top-2 -right-2 bg-gradient-to-br from-[#cc8a00] to-[#ff6b00] text-white text-xs font-bold px-3 py-1.5 shadow-lg transform rotate-3 z-10",
        style: {
          boxShadow: "0 4px 12px rgba(204, 138, 0, 0.4)",
          borderRadius: "4px",
          letterSpacing: "0.5px",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }
      },
      "\u{1F381} ",
      t2.topupTiers?.promoBadge || "\u9650\u65F6\u52A0\u8D60"
    ),
    tier.recommended && /* @__PURE__ */ import_react14.default.createElement("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold tracking-widest bg-[var(--term-primary)] text-black" }, "RECOMMENDED"),
    tier.isPromo && /* @__PURE__ */ import_react14.default.createElement("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold tracking-widest bg-[var(--term-secondary)] text-black" }, "LIMITED OFFER"),
    /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react14.default.createElement("h3", { className: "text-lg font-bold tracking-wide text-[var(--term-primary)] uppercase" }, t2.tiers?.[tier.id]?.label || tier.label), tier.isPromo && tier.promoDiscount && /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-xs line-through text-[var(--term-text-soft)]" }, tier.promoNormalDiscount, "\u6298"), /* @__PURE__ */ import_react14.default.createElement("span", { className: "px-2 py-0.5 text-xs font-bold bg-[var(--term-secondary)] text-black" }, tier.promoDiscount, "\u6298"))),
    /* @__PURE__ */ import_react14.default.createElement("div", { className: "mt-2 flex items-baseline justify-between" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-3xl font-bold text-[var(--term-primary)]" }, "USD", tier.amount?.toLocaleString()), tier.isPromo && tier.promoSavePercent && /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-sm font-bold text-[var(--term-secondary)]" }, "-", tier.promoSavePercent)),
    tier.maydayBonus > 0 && /* @__PURE__ */ import_react14.default.createElement("div", { className: "mt-1.5" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-lg font-bold text-[var(--term-secondary)]" }, t2.topupTiers?.bonus || "+ \u8D60\u9001 $", tier.maydayBonus), /* @__PURE__ */ import_react14.default.createElement("span", { className: "ml-2 text-xs text-[var(--term-text-soft)]" }, t2.topupTiers?.actualCredit || "\u5B9E\u9645\u5230\u8D26 $", (tier.amount + tier.maydayBonus).toFixed(2)), /* @__PURE__ */ import_react14.default.createElement("span", { className: "ml-1 text-[10px] text-[var(--term-text-soft)]" }, "(", tier.bonusPercent, ")")),
    tier.bundleGift && /* @__PURE__ */ import_react14.default.createElement(
      "div",
      {
        className: "mt-3 flex items-center gap-3 border border-[var(--term-secondary)] p-2",
        style: { background: "linear-gradient(135deg, rgba(204,138,0,0.12), rgba(0,170,0,0.04))" }
      },
      /* @__PURE__ */ import_react14.default.createElement(
        "img",
        {
          src: tier.bundleGift.image,
          alt: tier.bundleGift.name,
          width: 56,
          height: 56,
          loading: "lazy",
          className: "h-14 w-14 flex-shrink-0 rounded-sm object-cover"
        }
      ),
      /* @__PURE__ */ import_react14.default.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "text-sm font-bold text-[var(--term-secondary)]" }, t2.topupTiers?.giftFree || "\u514D\u8D39\u8D60\u9001", " ", /* @__PURE__ */ import_react14.default.createElement(BundleGiftNameLink, { name: tier.bundleGift.name, title: t2.topupTiers?.giftOfficialLink || "\u67E5\u770B\u5B98\u7F51\u4ECB\u7ECD" }), tier.bundleGift.quantity > 1 && /* @__PURE__ */ import_react14.default.createElement("span", null, " \xD7 ", tier.bundleGift.quantity)), /* @__PURE__ */ import_react14.default.createElement("div", { className: "text-xs text-[var(--term-text-soft)]" }, t2.topupTiers?.giftRetail || "\u5B98\u7F51\u4EF7", " ", /* @__PURE__ */ import_react14.default.createElement("span", { className: "line-through" }, "\xA5", (tier.bundleGift.retailPriceCny * tier.bundleGift.quantity).toLocaleString())), /* @__PURE__ */ import_react14.default.createElement("div", { className: "text-[10px] text-[var(--term-text-soft)]" }, t2.topupTiers?.giftWarranty || "* \u8D60\u54C1\u5168\u7A0B\u63D0\u4F9B\u4FDD\u4FEE/\u9000\u6362\u670D\u52A1"))
    ),
    /* @__PURE__ */ import_react14.default.createElement("p", { className: "mt-2 text-sm text-[var(--term-text-soft)]" }, t2.tiers?.[tier.id]?.description || tier.description),
    /* @__PURE__ */ import_react14.default.createElement("div", { className: "mt-5 mb-4" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex items-center gap-2 text-[10px] tracking-widest text-[var(--term-text-soft)] uppercase" }, /* @__PURE__ */ import_react14.default.createElement("span", null, "INCLUDED:"), /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex-1 border-t border-dashed border-[var(--term-muted)]" }))),
    /* @__PURE__ */ import_react14.default.createElement("ul", { className: "flex-1 space-y-3 mb-6" }, (t2.tiers?.[tier.id]?.included || tier.included).map((item, i) => /* @__PURE__ */ import_react14.default.createElement("li", { key: i, className: "flex items-start gap-2 text-sm text-[var(--term-primary)]" }, /* @__PURE__ */ import_react14.default.createElement(Check, { className: "h-4 w-4 mt-0.5 flex-shrink-0" }), /* @__PURE__ */ import_react14.default.createElement("span", null, item))), /* @__PURE__ */ import_react14.default.createElement("li", { className: "flex items-start gap-2 text-sm text-[var(--term-primary)]" }, /* @__PURE__ */ import_react14.default.createElement(Check, { className: "h-4 w-4 mt-0.5 flex-shrink-0" }), /* @__PURE__ */ import_react14.default.createElement("span", null, tier.amount >= 300 ? t2.topupTiers?.taxIncluded || "\u542B\u7A0E" : t2.topupTiers?.taxExcluded || "\u4E0D\u542B\u7A0E"))),
    /* @__PURE__ */ import_react14.default.createElement(
      "button",
      {
        type: "button",
        onClick: (e) => {
          e.stopPropagation();
          onSelect(tier);
        },
        disabled: isLoading,
        className: `w-full py-3 text-sm font-semibold tracking-wider transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${tier.recommended ? "bg-[var(--term-primary)] text-black hover:brightness-110" : "border border-dashed border-[var(--term-muted)] text-[var(--term-primary)] hover:border-[var(--term-primary)]"}`
      },
      isLoading ? /* @__PURE__ */ import_react14.default.createElement("span", { className: "flex items-center justify-center gap-2" }, /* @__PURE__ */ import_react14.default.createElement("svg", { className: "animate-spin h-4 w-4", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react14.default.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), /* @__PURE__ */ import_react14.default.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })), t2.topupTiers?.processing || "\u5904\u7406\u4E2D...") : tier.recommended ? t2.topupTiers?.buyNow || "\u7ACB\u5373\u5145\u503C" : `[ ${t2.topupTiers?.buyNow || "\u7ACB\u5373\u5145\u503C"} ]`
    )
  );
}
function TopupTiersGrid({ loading, selectedPlan, onPlanSelect, promotionConfig, poolPromoEnabled }) {
  const t2 = getTranslations("pricing", {});
  const [customAmount, setCustomAmount] = (0, import_react14.useState)("");
  const [showAllTiers, setShowAllTiers] = (0, import_react14.useState)(true);
  const [showCustomTopup, setShowCustomTopup] = (0, import_react14.useState)(false);
  const minAmount = 13.88;
  const claudeMeta = getModelConsumptionMeta(null, "claude");
  const codexMeta = getModelConsumptionMeta(null, "codex");
  const allTiers = getTopupTiersWithPromotion(promotionConfig);
  const tiers = poolPromoEnabled ? allTiers : allTiers.filter((t3) => t3.id !== "pool_promo");
  const initialVisibleCount = 6;
  const visibleTiers = showAllTiers ? tiers : tiers.slice(0, initialVisibleCount);
  const mayday = promotionConfig?.mayday;
  const bundleGift = promotionConfig?.bundle_gift;
  const getCustomBonus = (amount) => {
    return { bonus: 0, percent: "0%" };
  };
  const handleCustomPurchase = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < minAmount) return;
    const { bonus } = getCustomBonus(amount);
    onPlanSelect({
      id: "custom_topup",
      price: amount,
      name: `${t2.topupTiers?.customTopupName || "\u81EA\u5B9A\u4E49\u5145\u503C $"}${amount}`,
      bonus
    });
  };
  const customAmountNum = parseFloat(customAmount) || 0;
  const isCustomValid = customAmountNum >= minAmount;
  return /* @__PURE__ */ import_react14.default.createElement("div", null, mayday?.active && /* @__PURE__ */ import_react14.default.createElement(
    "div",
    {
      className: "mb-6 border border-[var(--term-secondary)] p-4 text-center",
      style: {
        background: "linear-gradient(135deg, rgba(204,138,0,0.08), rgba(0,170,0,0.06))",
        borderStyle: "solid"
      }
    },
    /* @__PURE__ */ import_react14.default.createElement("h2", { className: "text-xl font-bold tracking-wider text-[var(--term-secondary)]" }, t2.topupTiers?.maydayTitle || "\u9650\u65F6\u5145\u503C\u52A0\u8D60"),
    /* @__PURE__ */ import_react14.default.createElement("p", { className: "mt-1 text-sm text-[var(--term-text-main)]" }, mayday.start_date, " \u2014 ", mayday.end_date, /* @__PURE__ */ import_react14.default.createElement("span", { className: "mx-2 text-[var(--term-muted)]" }, "|"), t2.topupTiers?.maydayNote || "\u603B\u8BA9\u5229 50 \u4E07\u5200\uFF0C\u5148\u5230\u5148\u5F97\uFF0C\u9001\u5B8C\u5373\u6B62"),
    false
  ), bundleGift?.active && /* @__PURE__ */ import_react14.default.createElement(
    "div",
    {
      className: "mb-6 flex flex-col items-center gap-4 border border-[var(--term-secondary)] p-4 sm:flex-row sm:text-left text-center",
      style: { background: "linear-gradient(135deg, rgba(204,138,0,0.10), rgba(0,170,0,0.05))" }
    },
    /* @__PURE__ */ import_react14.default.createElement(
      "img",
      {
        src: bundleGift.gift_image,
        alt: bundleGift.gift_name,
        width: 88,
        height: 88,
        className: "h-[88px] w-[88px] flex-shrink-0 rounded-sm object-cover"
      }
    ),
    /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react14.default.createElement("h2", { className: "text-xl font-bold tracking-wider text-[var(--term-secondary)]" }, (() => {
      const [before, after = ""] = (t2.topupTiers?.giftTitle || "\u5145\u503C $1000 \u9001 {name}").split("{name}");
      return /* @__PURE__ */ import_react14.default.createElement(import_react14.default.Fragment, null, before, /* @__PURE__ */ import_react14.default.createElement(BundleGiftNameLink, { name: bundleGift.gift_name, title: t2.topupTiers?.giftOfficialLink || "\u67E5\u770B\u5B98\u7F51\u4ECB\u7ECD" }), after);
    })()), /* @__PURE__ */ import_react14.default.createElement("p", { className: "mt-1 text-sm text-[var(--term-text-main)]" }, (t2.topupTiers?.giftSubtitle || "\u5B98\u7F51\u4EF7 \xA5{price}\uFF0C$1000 / $1500 \u6863\u9001 1 \u526F\uFF0C$3000 \u6863\u9001 2 \u526F").replace("{price}", bundleGift.retail_price_cny.toLocaleString())), /* @__PURE__ */ import_react14.default.createElement("p", { className: "mt-1 text-xs text-[var(--term-text-soft)]" }, bundleGift.start_date, " \u2014 ", bundleGift.end_date, /* @__PURE__ */ import_react14.default.createElement("span", { className: "mx-2 text-[var(--term-muted)]" }, "|"), (t2.topupTiers?.giftStock || "\u9650\u91CF {max} \u526F\uFF0C\u5269\u4F59 {remaining} \u526F").replace("{max}", bundleGift.max_stock).replace("{remaining}", bundleGift.remaining_stock), /* @__PURE__ */ import_react14.default.createElement("span", { className: "mx-2 text-[var(--term-muted)]" }, "|"), (t2.topupTiers?.giftShipNote || "\u4EC5\u9650\u4E2D\u56FD\u5927\u9646\u5730\u5740\uFF0C\u652F\u4ED8 {days} \u5929\u540E\u53D1\u8D27").replace("{days}", bundleGift.ship_delay_days)), /* @__PURE__ */ import_react14.default.createElement("p", { className: "mt-1 text-xs text-[var(--term-text-soft)]" }, t2.topupTiers?.giftHowToShip || "\u5145\u503C\u6210\u529F\u540E\u8FDB\u5165\u793E\u7FA4 @\u5927\u52A9\u624B \u5904\u7406\u53D1\u8D27\u4E8B\u5B9C", /* @__PURE__ */ import_react14.default.createElement("span", { className: "mx-2 text-[var(--term-muted)]" }, "|"), t2.topupTiers?.giftWarranty || "* \u8D60\u54C1\u5168\u7A0B\u63D0\u4F9B\u4FDD\u4FEE/\u9000\u6362\u670D\u52A1"))
  ), /* @__PURE__ */ import_react14.default.createElement("div", { className: "mb-6 text-center text-sm text-[var(--term-text-soft)]" }, t2.topupTiers?.exchangeNote || "\u5145\u503C", " ", /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-[var(--term-primary)] font-semibold" }, t2.topupTiers?.exchangeOneUsd || "1 \u7F8E\u5143"), " = Claude ", /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-[var(--term-secondary)] font-semibold" }, claudeMeta.multiplierText), " / Codex ", /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-[var(--term-secondary)] font-semibold" }, codexMeta.multiplierText), /* @__PURE__ */ import_react14.default.createElement("span", { className: "mx-2 text-[var(--term-muted)]" }, "|"), t2.topupTiers?.minimum || "\u6700\u4F4E", " ", /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-[var(--term-primary)] font-semibold" }, "$13.88")), /* @__PURE__ */ import_react14.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" }, visibleTiers.map((tier) => /* @__PURE__ */ import_react14.default.createElement(
    TopupTierCard,
    {
      key: tier.id,
      tier,
      loading,
      isSelected: selectedPlan?.id === tier.id,
      onSelect: (currentTier) => {
        onPlanSelect({
          id: currentTier.id,
          price: currentTier.amount,
          name: `${currentTier.label} $${currentTier.amount}`,
          bonus: currentTier.bonus
        });
      }
    }
  ))), tiers.length > initialVisibleCount && /* @__PURE__ */ import_react14.default.createElement("div", { className: "mb-8 flex justify-center" }, /* @__PURE__ */ import_react14.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowAllTiers((prev) => !prev),
      className: "term-btn px-5 py-2 text-sm"
    },
    showAllTiers ? t2.topupTiers?.collapseAdvanced || "\u6536\u8D77\u9AD8\u7EA7\u6863\u4F4D" : `${t2.topupTiers?.showMore || "\u67E5\u770B\u66F4\u591A\u6863\u4F4D"}\uFF08+${tiers.length - initialVisibleCount}\uFF09`
  )), /* @__PURE__ */ import_react14.default.createElement("div", { className: "border border-[var(--term-muted)] p-5" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "text-sm text-[var(--term-text-soft)] tracking-wider uppercase" }, "+-- custom_amount --+"), /* @__PURE__ */ import_react14.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowCustomTopup((prev) => !prev),
      className: "text-xs px-2 py-1 border border-[var(--term-muted)] text-[var(--term-text-main)] hover:text-[var(--term-primary)] hover:border-[var(--term-primary)] transition-colors"
    },
    showCustomTopup ? t2.topupTiers?.collapse || "\u6536\u8D77" : t2.topupTiers?.expand || "\u5C55\u5F00"
  )), !showCustomTopup && /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ import_react14.default.createElement("p", { className: "text-sm text-[var(--term-text-main)]" }, t2.topupTiers?.customAmountNote || "\u652F\u6301\u4EFB\u610F\u91D1\u989D\u5145\u503C\uFF0C\u6700\u4F4E $", minAmount), /* @__PURE__ */ import_react14.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowCustomTopup(true),
      className: "px-4 py-1.5 text-sm border border-dashed border-[var(--term-muted)] text-[var(--term-primary)] hover:border-[var(--term-primary)] transition-colors"
    },
    "[ ",
    t2.topupTiers?.customTopup || "\u81EA\u5B9A\u4E49\u5145\u503C",
    " ]"
  )), showCustomTopup && /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex flex-col gap-4" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex flex-wrap gap-2" }, [13.88, 20, 55.88, 111.88, 500, 1e3, 1500, 3e3].map((amount) => /* @__PURE__ */ import_react14.default.createElement(
    "button",
    {
      key: amount,
      type: "button",
      onClick: () => setCustomAmount(amount.toString()),
      className: `px-3 py-1.5 text-sm border transition-colors ${customAmountNum === amount ? "border-[var(--term-primary)] bg-[var(--term-primary)] text-black" : "border-[var(--term-muted)] text-[var(--term-text-soft)] hover:border-[var(--term-primary)] hover:text-[var(--term-primary)]"}`
    },
    "$",
    amount
  ))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "flex items-center gap-3 flex-wrap" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--term-text-soft)]" }, "$"), /* @__PURE__ */ import_react14.default.createElement(
    "input",
    {
      type: "number",
      min: minAmount,
      step: "1",
      value: customAmount,
      onChange: (e) => setCustomAmount(e.target.value),
      placeholder: `${minAmount}`,
      className: "term-input w-32 pr-3 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
      style: { paddingLeft: "1.75rem" }
    }
  )), /* @__PURE__ */ import_react14.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleCustomPurchase,
      disabled: !isCustomValid || loading,
      className: `px-5 py-2 text-sm font-semibold border border-dashed border-[var(--term-muted)] text-[var(--term-primary)] hover:border-[var(--term-primary)] transition-colors ${!isCustomValid || loading ? "opacity-40 cursor-not-allowed" : ""}`
    },
    loading && selectedPlan?.id === "custom_topup" ? t2.topupTiers?.processing || "\u5904\u7406\u4E2D..." : `[ ${t2.topupTiers?.buyNow || "\u7ACB\u5373\u5145\u503C"} ]`
  )))));
}

// frontend/components/pricing/BundleGiftClaimCard.jsx
var import_react15 = __toESM(require_react());
function BundleGiftClaimCard() {
  const t2 = getTranslations("pricing", {});
  const tg = t2.bundleGiftClaim || {};
  const [claims, setClaims] = (0, import_react15.useState)([]);
  (0, import_react15.useEffect)(() => {
    if (typeof window === "undefined" || !isAuthenticated()) return;
    fetch("/api/bundle-gift/claims").then((resp) => resp.ok ? resp.json() : null).then((data) => {
      if (data?.success) setClaims(data.data || []);
    }).catch(() => {
    });
  }, []);
  if (claims.length === 0) return null;
  const lang = typeof window !== "undefined" && window.location.pathname.startsWith("/en") ? "en" : "zh";
  return /* @__PURE__ */ import_react15.default.createElement("section", { className: "mb-6 border border-[var(--term-secondary)] p-4", "aria-labelledby": "bundle-gift-claim-title" }, /* @__PURE__ */ import_react15.default.createElement("h2", { id: "bundle-gift-claim-title", className: "text-base font-bold tracking-wider text-[var(--term-secondary)]" }, "\u{1F3A7} ", tg.title || "\u4F60\u7684\u5145\u503C\u8D60\u54C1"), /* @__PURE__ */ import_react15.default.createElement("ul", { className: "mt-3 space-y-2" }, claims.map((claim) => /* @__PURE__ */ import_react15.default.createElement("li", { key: claim.id, className: "flex flex-wrap items-center justify-between gap-2 border border-dashed border-[var(--term-muted)] p-3 text-sm" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-[var(--term-primary)]" }, claim.gift_name, " \xD7 ", claim.quantity, /* @__PURE__ */ import_react15.default.createElement("span", { className: "ml-2 text-xs text-[var(--term-text-soft)]" }, tg.order || "\u8BA2\u5355\u53F7", ": ", claim.order_no)), /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-xs text-[var(--term-text-soft)]" }, claim.status === "shipped" ? `${tg.statusShipped || "\u5DF2\u53D1\u8D27"}${claim.tracking_no ? ` \xB7 ${claim.tracking_no}` : ""}` : tg.statusPending || "\u5F85\u53D1\u8D27")))), /* @__PURE__ */ import_react15.default.createElement("p", { className: "mt-3 text-sm text-[var(--term-text-main)]" }, tg.howToShip || "\u8BF7\u8FDB\u5165\u793E\u7FA4 @\u5927\u52A9\u624B\uFF0C\u5E76\u63D0\u4F9B\u8BA2\u5355\u53F7\u548C\u6536\u8D27\u4FE1\u606F\uFF0C\u7531\u5927\u52A9\u624B\u5904\u7406\u53D1\u8D27\u4E8B\u5B9C\u3002", /* @__PURE__ */ import_react15.default.createElement("a", { href: `/${lang}/contact`, className: "ml-2 text-[var(--term-secondary)] underline hover:brightness-110" }, tg.joinCommunity || "\u52A0\u5165\u793E\u7FA4")), /* @__PURE__ */ import_react15.default.createElement("p", { className: "mt-1 text-xs text-[var(--term-text-soft)]" }, tg.warranty || "* \u8D60\u54C1\u5168\u7A0B\u63D0\u4F9B\u4FDD\u4FEE/\u9000\u6362\u670D\u52A1\u3002"));
}

// frontend/components/pricing/TopupComparisonTable.jsx
var import_react16 = __toESM(require_react());
function TopupComparisonTable() {
  const t2 = getTranslations("pricing", {});
  const [expanded, setExpanded] = (0, import_react16.useState)(false);
  return /* @__PURE__ */ import_react16.default.createElement("div", { className: "mb-12" }, /* @__PURE__ */ import_react16.default.createElement("div", { className: "border border-[var(--term-muted)] overflow-hidden" }, /* @__PURE__ */ import_react16.default.createElement("div", { className: "flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--term-muted)]" }, /* @__PURE__ */ import_react16.default.createElement("span", { className: "text-sm text-[var(--term-text-soft)] tracking-wider uppercase" }, "+-- compare/tiers --+"), /* @__PURE__ */ import_react16.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setExpanded((prev) => !prev),
      className: "text-xs px-2 py-1 border border-[var(--term-muted)] text-[var(--term-text-main)] hover:text-[var(--term-primary)] hover:border-[var(--term-primary)] transition-colors"
    },
    expanded ? t2.comparison?.collapse || "\u6536\u8D77" : t2.comparison?.expand || "\u5C55\u5F00"
  )), expanded && /* @__PURE__ */ import_react16.default.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ import_react16.default.createElement("table", { className: "w-full text-sm" }, /* @__PURE__ */ import_react16.default.createElement("thead", null, /* @__PURE__ */ import_react16.default.createElement("tr", { className: "text-[var(--term-text-soft)] bg-[#141b17]" }, /* @__PURE__ */ import_react16.default.createElement("th", { className: "px-4 py-3 text-left font-semibold" }, t2.comparison?.amount || "\u91D1\u989D"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "px-4 py-3 text-left font-semibold" }, t2.comparison?.keys || "Key"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "px-4 py-3 text-left font-semibold" }, t2.comparison?.enterprise || "\u4F01\u4E1A\u6743\u9650"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "px-4 py-3 text-left font-semibold" }, t2.comparison?.targetUser || "\u63A8\u8350\u4EBA\u7FA4"))), /* @__PURE__ */ import_react16.default.createElement("tbody", null, TOPUP_TIERS.filter((tier) => !tier.isPromo).map((tier) => /* @__PURE__ */ import_react16.default.createElement(
    "tr",
    {
      key: tier.id,
      className: "transition-colors hover:bg-[#18221c] border-t border-[var(--term-muted)]"
    },
    /* @__PURE__ */ import_react16.default.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ import_react16.default.createElement("span", { className: "font-semibold text-[var(--term-primary)]" }, "$", tier.amount)),
    /* @__PURE__ */ import_react16.default.createElement("td", { className: "px-4 py-3 text-[var(--term-text-main)]" }, tier.features.apiKeys),
    /* @__PURE__ */ import_react16.default.createElement("td", { className: "px-4 py-3" }, tier.isEnterprise ? /* @__PURE__ */ import_react16.default.createElement("div", { className: "flex items-center gap-1 text-[var(--term-primary)]" }, /* @__PURE__ */ import_react16.default.createElement(Check, { className: "h-4 w-4" })) : /* @__PURE__ */ import_react16.default.createElement("div", { className: "flex items-center gap-1 text-[var(--term-text-soft)]" }, /* @__PURE__ */ import_react16.default.createElement(X, { className: "h-4 w-4" }))),
    /* @__PURE__ */ import_react16.default.createElement("td", { className: "px-4 py-3 text-[var(--term-text-main)]" }, tier.targetUser)
  )))))));
}

// frontend/components/pricing/TopupSubscriptionTabs.jsx
var import_react17 = __toESM(require_react());
function TopupSubscriptionTabs({ activeTab, onChange, className = "", align = "center" }) {
  const t2 = getTranslations("pricing", {});
  const allTabs = [
    { id: "topup", label: t2.topupSubscriptionTabs?.topup || "\u7075\u6D3B\u5145\u503C", disabled: false },
    { id: "subscription", label: t2.topupSubscriptionTabs?.subscription || "\u8D85\u503C\u8BA2\u9605", disabled: true },
    { id: "openclaw", label: t2.topupSubscriptionTabs?.openclaw || "\u5C0F\u9F99\u867E\u5957\u9910", disabled: true }
  ];
  const tabs = allTabs.filter((tab) => !tab.disabled);
  if (tabs.length <= 1) {
    return null;
  }
  const handleTabClick = (tab) => {
    if (tab.disabled) {
      alert(t2.topupSubscriptionTabs?.notAvailable || "\u8BE5\u529F\u80FD\u6682\u672A\u5F00\u653E,\u656C\u8BF7\u671F\u5F85!");
      return;
    }
    onChange(tab.id);
  };
  return /* @__PURE__ */ import_react17.default.createElement("div", { className: `flex ${align === "right" ? "justify-end" : "justify-center"} ${className}` }, /* @__PURE__ */ import_react17.default.createElement("div", { className: "w-full max-w-[560px] term-panel p-1 flex flex-row gap-1" }, tabs.map((tab) => /* @__PURE__ */ import_react17.default.createElement(
    "button",
    {
      key: tab.id,
      onClick: () => handleTabClick(tab),
      disabled: tab.disabled,
      className: `
							flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-[12px] md:text-[13px] font-semibold transition-colors duration-150 border
							${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}
							${activeTab === tab.id ? "border-[var(--term-primary)] bg-[var(--term-primary)] text-black" : "border-transparent text-[var(--term-text-soft)] hover:border-[var(--term-muted)] hover:text-[var(--term-primary)]"}
						`
    },
    tab.id === "topup" ? /* @__PURE__ */ import_react17.default.createElement(Wallet, { className: "h-3.5 w-3.5 flex-shrink-0" }) : tab.id === "subscription" ? /* @__PURE__ */ import_react17.default.createElement(CalendarDays, { className: "h-3.5 w-3.5 flex-shrink-0" }) : /* @__PURE__ */ import_react17.default.createElement(
      "img",
      {
        src: "/assets/openclaw.svg",
        alt: "Openclaw",
        className: "h-3.5 w-3.5 flex-shrink-0",
        style: { objectFit: "contain", display: "block" }
      }
    ),
    /* @__PURE__ */ import_react17.default.createElement("span", { className: "truncate" }, tab.label)
  ))));
}

// frontend/components/pricing/SubscriptionPlansSection.jsx
var import_react18 = __toESM(require_react());
function SubscriptionPlansSection2({ onPlanSelect }) {
  const t2 = getTranslations("pricing", {});
  const [billingCycle, setBillingCycle] = (0, import_react18.useState)("monthly");
  const claudeMeta = getModelConsumptionMeta(null, "claude");
  const subscriptionPlans = [
    {
      id: "subscription_basic",
      name: t2.subscription?.basic || "\u57FA\u7840\u7248",
      nameEn: "basic",
      monthlyPrice: 69,
      dailyQuota: 5,
      features: t2.subscription?.basic_features || [
        "\u6BCF\u65E5\u81EA\u52A8\u53D1\u653E $5 \u989D\u5EA6",
        "\u989D\u5EA6\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6",
        "\u9002\u5408\u8F7B\u5EA6\u4F7F\u7528\u573A\u666F",
        "\u652F\u6301\u6240\u6709 Claude \u6A21\u578B"
      ]
    },
    {
      id: "subscription_pro",
      name: t2.subscription?.pro || "\u4E13\u4E1A\u7248",
      nameEn: "pro",
      monthlyPrice: 99,
      dailyQuota: 10,
      features: t2.subscription?.pro_features || [
        "\u6BCF\u65E5\u81EA\u52A8\u53D1\u653E $10 \u989D\u5EA6",
        "\u989D\u5EA6\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6",
        "\u9002\u5408\u65E5\u5E38\u5F00\u53D1\u4F7F\u7528",
        "\u652F\u6301\u6240\u6709 Claude \u6A21\u578B",
        "\u4F18\u5148\u6280\u672F\u652F\u6301"
      ]
    },
    {
      id: "subscription_flagship",
      name: t2.subscription?.flagship || "\u65D7\u8230\u7248",
      nameEn: "flagship",
      monthlyPrice: 169,
      dailyQuota: 20,
      features: t2.subscription?.flagship_features || [
        "\u6BCF\u65E5\u81EA\u52A8\u53D1\u653E $20 \u989D\u5EA6",
        "\u989D\u5EA6\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6",
        "\u9002\u5408\u91CD\u5EA6\u4F7F\u7528\u573A\u666F",
        "\u652F\u6301\u6240\u6709 Claude \u6A21\u578B",
        "\u4F18\u5148\u6280\u672F\u652F\u6301",
        "\u4E13\u5C5E\u5BA2\u6237\u7ECF\u7406"
      ]
    }
  ];
  const calculatePrice = (monthlyPrice) => {
    if (billingCycle === "quarterly") return monthlyPrice * 3 * 0.905;
    if (billingCycle === "yearly") return monthlyPrice * 12 * 0.915;
    return monthlyPrice;
  };
  const calculateActualUsage = (dailyQuota) => {
    const days = billingCycle === "yearly" ? 365 : billingCycle === "quarterly" ? 90 : 30;
    return calculateModelUsageEquivalent(dailyQuota * days, claudeMeta.discount).toFixed(2);
  };
  const getCycleText = () => {
    if (billingCycle === "quarterly") return t2.subscription?.quarterlyBilling || "\u5B63\u4ED8 \u8BA1\u8D39";
    if (billingCycle === "yearly") return t2.subscription?.yearlyBilling || "\u5E74\u4ED8 \u8BA1\u8D39";
    return t2.subscription?.monthlyBilling || "\u6708\u4ED8 \u8BA1\u8D39";
  };
  const getCycleMultiplier = () => {
    if (billingCycle === "quarterly") return 3;
    if (billingCycle === "yearly") return 12;
    return 1;
  };
  const getCyclePrice = (plan) => {
    if (billingCycle === "quarterly") return calculatePrice(plan.monthlyPrice);
    if (billingCycle === "yearly") return calculatePrice(plan.monthlyPrice);
    return plan.monthlyPrice;
  };
  const cycleOptions = [
    { key: "monthly", label: t2.subscription?.monthly || "\u6708\u4ED8" },
    { key: "quarterly", label: t2.subscription?.quarterly || "\u5B63\u4ED8 9.5\u6298" },
    { key: "yearly", label: t2.subscription?.yearly || "\u5E74\u4ED8 8.5\u6298" }
  ];
  return /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10" }, subscriptionPlans.map((plan) => {
    const totalPrice = calculatePrice(plan.monthlyPrice);
    const actualUsage = calculateActualUsage(plan.dailyQuota);
    const cycleMultiplier = getCycleMultiplier();
    return /* @__PURE__ */ import_react18.default.createElement(
      "div",
      {
        key: plan.id,
        className: "term-window p-4 md:p-5 border border-[var(--term-muted)] flex flex-col"
      },
      /* @__PURE__ */ import_react18.default.createElement("div", { className: "term-window-title -mx-4 md:-mx-5 -mt-4 md:-mt-5 mb-4" }, "[", plan.id, "] ", plan.nameEn),
      /* @__PURE__ */ import_react18.default.createElement("div", { className: "mb-4" }, /* @__PURE__ */ import_react18.default.createElement("h3", { className: "text-lg font-bold text-[var(--term-primary)]" }, "$", totalPrice.toFixed(2), " \xB7 ", plan.name), /* @__PURE__ */ import_react18.default.createElement("p", { className: "text-xs text-[var(--term-text-soft)] mt-1" }, getCycleText(), " \u8BA1\u8D39 \xB7 \u6BCF\u65E5\u53EF\u7528 $", (plan.dailyQuota * claudeMeta.multiplier).toFixed(2))),
      /* @__PURE__ */ import_react18.default.createElement("div", { className: "grid grid-cols-3 gap-1 mb-4" }, cycleOptions.map((cycle) => /* @__PURE__ */ import_react18.default.createElement(
        "button",
        {
          key: cycle.key,
          onClick: () => setBillingCycle(cycle.key),
          className: `px-2 py-1.5 text-[11px] md:text-xs border transition-colors ${billingCycle === cycle.key ? "border-[var(--term-secondary)] bg-[var(--term-secondary)] text-black" : "border-[var(--term-muted)] text-[var(--term-text-soft)] hover:border-[var(--term-primary)] hover:text-[var(--term-primary)]"}`
        },
        cycle.label
      ))),
      /* @__PURE__ */ import_react18.default.createElement("div", { className: "term-panel p-3 mb-4 border border-[var(--term-muted)] text-sm" }, /* @__PURE__ */ import_react18.default.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-[var(--term-text-soft)]" }, t2.subscription?.paymentAmount || "\u4ED8\u8D39\u91D1\u989D"), /* @__PURE__ */ import_react18.default.createElement("span", { className: "font-semibold text-[var(--term-primary)]" }, "$", totalPrice.toFixed(0))), /* @__PURE__ */ import_react18.default.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-[var(--term-text-soft)]" }, t2.subscription?.dailyQuota || "\u6BCF\u65E5\u989D\u5EA6"), /* @__PURE__ */ import_react18.default.createElement("span", { className: "font-semibold text-[var(--term-secondary)]" }, "$", (plan.dailyQuota * claudeMeta.multiplier).toFixed(2))), billingCycle !== "monthly" && /* @__PURE__ */ import_react18.default.createElement("div", { className: "pt-2 border-t border-[var(--term-muted)] text-xs text-[var(--term-secondary)] text-right" }, t2.subscription?.save || "\u8282\u7701 $", (plan.monthlyPrice * cycleMultiplier - totalPrice).toFixed(0)), /* @__PURE__ */ import_react18.default.createElement("div", { className: "pt-2 mt-2 border-t border-[var(--term-muted)]" }, /* @__PURE__ */ import_react18.default.createElement("div", { className: "flex items-center justify-between pt-1" }, /* @__PURE__ */ import_react18.default.createElement("div", { className: "flex flex-col" }, /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-xs text-[var(--term-secondary)] font-medium mb-1" }, t2.subscription?.claudeActualUsage || "Claude \u5B9E\u9645\u53EF\u7528"), /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-xs text-[var(--term-text-main)]" }, "$", plan.dailyQuota, " \xD7 ", billingCycle === "yearly" ? 365 : billingCycle === "quarterly" ? 90 : 30, " \xF7 ", claudeMeta.discountText)), /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-lg font-bold text-[var(--term-primary)]" }, "$", actualUsage)))),
      /* @__PURE__ */ import_react18.default.createElement("ul", { className: "space-y-2 mb-6 flex-1 text-sm" }, plan.features.map((feature, index) => /* @__PURE__ */ import_react18.default.createElement("li", { key: index, className: "flex items-start gap-2 text-[var(--term-text-main)]" }, /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-[var(--term-primary)] mt-0.5" }, ">"), /* @__PURE__ */ import_react18.default.createElement("span", null, feature)))),
      /* @__PURE__ */ import_react18.default.createElement("div", { className: "space-y-2 mt-auto" }, /* @__PURE__ */ import_react18.default.createElement(
        "button",
        {
          disabled: true,
          className: "term-btn-secondary w-full py-3 text-sm font-semibold cursor-not-allowed opacity-50"
        },
        "[ ",
        t2.subscription?.selectPlan || "\u9009\u62E9\u5957\u9910",
        " ]"
      ), /* @__PURE__ */ import_react18.default.createElement("div", { className: "text-center text-xs text-[var(--term-muted)] font-mono" }, /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-[var(--term-secondary)]" }, ">"), " status: ", /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-[var(--term-secondary)]" }, "[PENDING]"), " ", t2.subscription?.pending || "\u5957\u9910\u5F00\u53D1\u4E2D..."))
    );
  })), /* @__PURE__ */ import_react18.default.createElement("div", { className: "term-window p-4 border border-[var(--term-muted)]" }, /* @__PURE__ */ import_react18.default.createElement("div", { className: "term-window-title -mx-4 -mt-4 mb-4" }, "+-- faq --+"), /* @__PURE__ */ import_react18.default.createElement("div", { className: "space-y-5 max-w-4xl mx-auto text-sm" }, /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("h4", { className: "font-semibold text-[var(--term-primary)] mb-2" }, t2.subscription?.faq_q1 || "Q: \u8BA2\u9605\u5957\u9910\u7684\u989D\u5EA6\u5982\u4F55\u53D1\u653E\uFF1F"), /* @__PURE__ */ import_react18.default.createElement("p", { className: "text-[var(--term-text-main)]" }, t2.subscription?.faq_a1 || "A: \u6BCF\u5929\u81EA\u52A8\u53D1\u653E\u5230\u60A8\u7684\u8D26\u6237\uFF0C\u65E0\u9700\u624B\u52A8\u64CD\u4F5C\u3002\u989D\u5EA6\u5728\u5F53\u5929\u6709\u6548\uFF0C\u6B21\u65E5\u6E05\u96F6\uFF0C\u4E0D\u7D2F\u8BA1\u3002")), /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("h4", { className: "font-semibold text-[var(--term-primary)] mb-2" }, t2.subscription?.faq_q2 || "Q: \u8BA2\u9605\u5957\u9910\u5305\u542B\u4F01\u4E1A\u7248\u529F\u80FD\u5417\uFF1F"), /* @__PURE__ */ import_react18.default.createElement("p", { className: "text-[var(--term-text-main)]" }, t2.subscription?.faq_a2 || "A: \u4E0D\u5305\u542B\u3002\u9700\u8981\u56E2\u961F\u7BA1\u7406\u6216 API \u7B49\u4F01\u4E1A\u529F\u80FD\u65F6\uFF0C\u8BF7\u9009\u62E9\u7075\u6D3B\u5145\u503C\u7684\u4F01\u4E1A\u6863\u4F4D\u3002")), /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("h4", { className: "font-semibold text-[var(--term-primary)] mb-2" }, t2.subscription?.faq_q3 || "Q: \u5982\u4F55\u8BA1\u7B97 Claude \u5B9E\u9645\u53EF\u7528\u989D\u5EA6\uFF1F"), /* @__PURE__ */ import_react18.default.createElement("p", { className: "text-[var(--term-text-main)]" }, t2.subscription?.faq_a3 || `A: \u4F7F\u7528\u516C\u5F0F\uFF1A\u6BCF\u65E5\u989D\u5EA6 \xD7 \u5929\u6570 \xF7 ${claudeMeta.discountText} = \u5B9E\u9645\u53EF\u6D88\u8017\u989D\u5EA6\u3002\u6708\u4ED8\u630930\u5929\uFF0C\u5B63\u4ED8\u630990\u5929\uFF0C\u5E74\u4ED8\u6309365\u5929\u8BA1\u7B97\u3002`)), /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("h4", { className: "font-semibold text-[var(--term-primary)] mb-2" }, t2.subscription?.faq_q4 || "Q: \u53EF\u4EE5\u968F\u65F6\u53D6\u6D88\u8BA2\u9605\u5417\uFF1F"), /* @__PURE__ */ import_react18.default.createElement("p", { className: "text-[var(--term-text-main)]" }, t2.subscription?.faq_a4 || "A: \u53EF\u4EE5\u3002\u60A8\u53EF\u4EE5\u968F\u65F6\u53D6\u6D88\u8BA2\u9605\uFF0C\u5DF2\u652F\u4ED8\u7684\u5468\u671F\u4F1A\u7EE7\u7EED\u670D\u52A1\u81F3\u5230\u671F\u3002")), /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("h4", { className: "font-semibold text-[var(--term-primary)] mb-2" }, t2.subscription?.faq_q5 || "Q: \u8BA2\u9605\u548C\u5145\u503C\u53EF\u4EE5\u540C\u65F6\u4F7F\u7528\u5417\uFF1F"), /* @__PURE__ */ import_react18.default.createElement("p", { className: "text-[var(--term-text-main)]" }, t2.subscription?.faq_a5 || "A: \u53EF\u4EE5\u3002\u8BA2\u9605\u5957\u9910\u548C\u7075\u6D3B\u5145\u503C\u53EF\u4EE5\u540C\u65F6\u4F7F\u7528\uFF0C\u989D\u5EA6\u4F1A\u81EA\u52A8\u53E0\u52A0\u3002")))));
}

// frontend/components/pricing/OpenclawSubscriptionSection.jsx
var import_react19 = __toESM(require_react());
function OpenclawSubscriptionSection({ onPlanSelect }) {
  const t2 = getTranslations("pricing", {});
  const plan = {
    id: "openclaw_chatgpt_plus",
    name: t2.openclaw?.title || "\u5C0F\u9F99\u867E\u5957\u9910",
    nameEn: "ChatGPT Plus Recharge",
    totalPrice: 10,
    totalPriceCNY: 72,
    features: t2.openclaw?.features || [
      "\u76F4\u5145\u4F60\u81EA\u5DF1\u7684 ChatGPT \u8D26\u53F7\uFF0C\u5347\u7EA7\u4E3A ChatGPT Plus",
      "\u539F\u4EF7 $20/\u6708\uFF0C\u73B0\u4EC5\u9700 $10/\u6708\uFF0C\u7ACB\u7701 50%",
      "\u65E0\u9700\u6D77\u5916\u4FE1\u7528\u5361\uFF0C\u652F\u4ED8\u6210\u529F\u540E\u5151\u6362\u4FE1\u606F\u5C06\u53D1\u9001\u5230\u7AD9\u5185\u4FE1"
    ]
  };
  return /* @__PURE__ */ import_react19.default.createElement("div", null, /* @__PURE__ */ import_react19.default.createElement("div", { className: "term-window p-5 md:p-6 flex flex-col md:flex-row gap-6 relative border-2 border-[var(--term-secondary)]" }, /* @__PURE__ */ import_react19.default.createElement("div", { className: "absolute -top-3 left-4 bg-[var(--term-secondary)] text-black px-3 py-0.5 text-xs font-bold" }, t2.openclaw?.save50 || "ChatGPT Plus \xB7 \u7701 50%"), /* @__PURE__ */ import_react19.default.createElement("div", { className: "term-window-title -mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-2 flex items-center gap-2" }, /* @__PURE__ */ import_react19.default.createElement("span", null, "[openclaw] ", plan.nameEn)), /* @__PURE__ */ import_react19.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react19.default.createElement("h3", { className: "text-xl font-bold text-[var(--term-primary)] mb-1" }, "$", plan.totalPrice, "/mo \xB7 ", plan.name), /* @__PURE__ */ import_react19.default.createElement("p", { className: "text-sm text-[var(--term-text-soft)] mb-4" }, t2.openclaw?.subtitle || "\u76F4\u5145\u4F60\u7684 ChatGPT \u8D26\u53F7\uFF0C\u5347\u7EA7\u4E3A Plus", " \xB7 ", /* @__PURE__ */ import_react19.default.createElement("span", { className: "text-[var(--term-secondary)] font-semibold" }, t2.openclaw?.originalPrice || "\u539F\u4EF7 $20/\u6708")), /* @__PURE__ */ import_react19.default.createElement("ul", { className: "space-y-2 text-sm" }, plan.features.map((feature, index) => /* @__PURE__ */ import_react19.default.createElement("li", { key: index, className: "flex items-start gap-2 text-[var(--term-text-main)]" }, /* @__PURE__ */ import_react19.default.createElement("span", { className: "text-[var(--term-primary)] mt-0.5" }, ">"), /* @__PURE__ */ import_react19.default.createElement("span", null, feature))))), /* @__PURE__ */ import_react19.default.createElement("div", { className: "md:w-64 flex flex-col justify-center" }, /* @__PURE__ */ import_react19.default.createElement("div", { className: "term-panel p-4 border border-[var(--term-muted)] text-sm mb-4" }, /* @__PURE__ */ import_react19.default.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ import_react19.default.createElement("span", { className: "text-[var(--term-text-soft)]" }, t2.openclaw?.paymentAmount || "\u4ED8\u8D39\u91D1\u989D"), /* @__PURE__ */ import_react19.default.createElement("span", { className: "font-semibold text-[var(--term-primary)] text-lg" }, "$", plan.totalPrice, "/mo")), /* @__PURE__ */ import_react19.default.createElement("div", { className: "pt-2 mt-2 border-t border-[var(--term-muted)]" }, /* @__PURE__ */ import_react19.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react19.default.createElement("span", { className: "text-xs text-[var(--term-secondary)]" }, t2.openclaw?.cnyEquivalent || "\u7EA6\u5408\u4EBA\u6C11\u5E01"), /* @__PURE__ */ import_react19.default.createElement("span", { className: "text-sm font-bold text-[var(--term-primary)]" }, "\xA5", plan.totalPriceCNY, "/mo")))), /* @__PURE__ */ import_react19.default.createElement(
    "button",
    {
      onClick: () => onPlanSelect(plan),
      className: "term-btn-secondary w-full py-3 text-sm font-semibold hover:bg-[var(--term-secondary)] hover:text-black transition-colors"
    },
    "[ ",
    t2.openclaw?.buyNow || "\u7ACB\u5373\u5145\u503C",
    " ]"
  ))), /* @__PURE__ */ import_react19.default.createElement("div", { className: "term-window p-4 border border-[var(--term-muted)] mt-10" }, /* @__PURE__ */ import_react19.default.createElement("div", { className: "term-window-title -mx-4 -mt-4 mb-4" }, "+-- faq --+"), /* @__PURE__ */ import_react19.default.createElement("div", { className: "space-y-5 max-w-4xl mx-auto text-sm" }, /* @__PURE__ */ import_react19.default.createElement("div", null, /* @__PURE__ */ import_react19.default.createElement("h4", { className: "font-semibold text-[var(--term-primary)] mb-2" }, t2.openclaw?.faq_q1 || "Q: \u5C0F\u9F99\u867E\u5957\u9910\u662F\u4EC0\u4E48\uFF1F"), /* @__PURE__ */ import_react19.default.createElement("p", { className: "text-[var(--term-text-main)]" }, t2.openclaw?.faq_a1 || "A: \u652F\u4ED8 $10/\u6708\uFF0C\u6211\u4EEC\u76F4\u5145\u4F60\u81EA\u5DF1\u7684 ChatGPT \u8D26\u53F7\uFF0C\u5E2E\u4F60\u5347\u7EA7\u4E3A ChatGPT Plus\uFF0C\u65E0\u9700\u6D77\u5916\u4FE1\u7528\u5361\u3002")), /* @__PURE__ */ import_react19.default.createElement("div", null, /* @__PURE__ */ import_react19.default.createElement("h4", { className: "font-semibold text-[var(--term-primary)] mb-2" }, t2.openclaw?.faq_q2 || "Q: \u5145\u503C\u540E\u591A\u4E45\u5230\u8D26\uFF1F"), /* @__PURE__ */ import_react19.default.createElement("p", { className: "text-[var(--term-text-main)]" }, t2.openclaw?.faq_a2 || "A: \u652F\u4ED8\u6210\u529F\u540E\u4F1A\u5C3D\u5FEB\u5904\u7406\u5145\u503C\uFF0C\u901A\u5E38\u5F88\u5FEB\u5230\u8D26\u3002\u5982\u6709\u5EF6\u8FDF\u8BF7\u8054\u7CFB\u5BA2\u670D\u3002")), /* @__PURE__ */ import_react19.default.createElement("div", null, /* @__PURE__ */ import_react19.default.createElement("h4", { className: "font-semibold text-[var(--term-primary)] mb-2" }, t2.openclaw?.faq_q3 || "Q: \u9700\u8981\u63D0\u4F9B\u4EC0\u4E48\u4FE1\u606F\uFF1F"), /* @__PURE__ */ import_react19.default.createElement("p", { className: "text-[var(--term-text-main)]" }, t2.openclaw?.faq_a3 || "A: \u652F\u4ED8\u6210\u529F\u540E\uFF0C\u5151\u6362\u4FE1\u606F\u5C06\u53D1\u9001\u5230\u7AD9\u5185\u4FE1\uFF0C\u6309\u7167\u6307\u5F15\u5373\u53EF\u5B8C\u6210 Plus \u5347\u7EA7\u3002")))));
}

// frontend/components/pricing/UpgradePathSection.jsx
var import_react20 = __toESM(require_react());

// frontend/hooks/usePricing.js
var import_react21 = __toESM(require_react());

// frontend/core/lib/purchaseEligibility.js
var monthlyProductIds = /* @__PURE__ */ new Set([
  "claude_code_normal",
  "claude_code_medium",
  "claude_code_large"
]);
var enterpriseGrowthProductIds = /* @__PURE__ */ new Set([
  "enterprise_starter",
  "enterprise_growth",
  "enterprise_scale",
  "enterprise_topup_300",
  "enterprise_topup_500",
  "enterprise_topup_1000",
  "enterprise_topup_1500",
  "enterprise_topup_3000"
]);
function isOrderActive(order) {
  try {
    if (!order || !order.end_date) return false;
    const now = /* @__PURE__ */ new Date();
    const end = new Date(order.end_date);
    const start = order.start_date ? new Date(order.start_date) : null;
    return now < end && (!start || now >= start);
  } catch (_) {
    return false;
  }
}
function isEligibleBaseProduct(productId) {
  if (!productId) return false;
  return monthlyProductIds.has(productId) || productId.startsWith("enterprise_");
}
function hasActiveEligibleBaseOrder(orders) {
  if (!Array.isArray(orders)) return false;
  for (const o of orders) {
    if (o && o.order_type === 1 && isOrderActive(o) && isEligibleBaseProduct(o.product_id)) {
      return true;
    }
  }
  return false;
}
async function canBuyCoinPack() {
  try {
    const resp = await fetch("/api/user_order?page=1&size=100");
    const data = await resp.json();
    if (!resp.ok) return false;
    const orders = Array.isArray(data.items) ? data.items : [];
    return hasActiveEligibleBaseOrder(orders);
  } catch (_) {
    return false;
  }
}
function isEligibleEnterpriseBaseProduct(productId) {
  if (!productId) return false;
  return enterpriseGrowthProductIds.has(productId);
}
function hasActiveEligibleEnterpriseBaseOrder(orders) {
  if (!Array.isArray(orders)) return false;
  for (const o of orders) {
    if (o && o.order_type === 1 && isOrderActive(o) && isEligibleEnterpriseBaseProduct(o.product_id)) {
      return true;
    }
  }
  return false;
}
async function canBuyEnterpriseCoinPack() {
  try {
    const resp = await fetch("/api/user_order?page=1&size=100");
    const data = await resp.json();
    if (!resp.ok) return false;
    const orders = Array.isArray(data.items) ? data.items : [];
    return hasActiveEligibleEnterpriseBaseOrder(orders);
  } catch (_) {
    return false;
  }
}

// frontend/hooks/usePricing.js
var import_qrcode = __toESM(require_browser());
function usePricing({ DEV_BYPASS = false, enterpriseTestMode = false } = {}) {
  const [minTopup, setMinTopup] = (0, import_react21.useState)(9.9);
  const [pricingPlans, setPricingPlans] = (0, import_react21.useState)(null);
  const [plansLoading, setPlansLoading] = (0, import_react21.useState)(false);
  const [hasLoaded, setHasLoaded] = (0, import_react21.useState)(false);
  const [error, setError] = (0, import_react21.useState)(null);
  const [poolPromoEnabled, setPoolPromoEnabled] = (0, import_react21.useState)(false);
  const [creditDisplay, setCreditDisplay] = (0, import_react21.useState)({
    mode: "quota",
    quotaCalculation: "price"
  });
  const [promotionConfig, setPromotionConfig] = (0, import_react21.useState)({
    topup_100_bonus_50_enabled: false,
    topup_100_bonus_50_title: "",
    topup_100_bonus_50_note: ""
  });
  const [personalPrices, setPersonalPrices] = (0, import_react21.useState)({});
  const [originalPersonalPrices, setOriginalPersonalPrices] = (0, import_react21.useState)(null);
  const [personalCredits, setPersonalCredits] = (0, import_react21.useState)({});
  const [hiddenPlans, setHiddenPlans] = (0, import_react21.useState)(/* @__PURE__ */ new Set());
  const [enterprisePlans, setEnterprisePlans] = (0, import_react21.useState)([]);
  const [enterprisePrices, setEnterprisePrices] = (0, import_react21.useState)({});
  const [originalEnterprisePrices, setOriginalEnterprisePrices] = (0, import_react21.useState)(null);
  const [originalEnterprisePlans, setOriginalEnterprisePlans] = (0, import_react21.useState)(null);
  const [couponCode, setCouponCode] = (0, import_react21.useState)("");
  const [appliedCoupon, setAppliedCoupon] = (0, import_react21.useState)(null);
  const [couponLoading, setCouponLoading] = (0, import_react21.useState)(false);
  const [originalPlans, setOriginalPlans] = (0, import_react21.useState)([]);
  const [showCouponInput, setShowCouponInput] = (0, import_react21.useState)(false);
  const [keySequence, setKeySequence] = (0, import_react21.useState)("");
  const [useBalance, setUseBalance] = (0, import_react21.useState)(false);
  const [currentBalance, setCurrentBalance] = (0, import_react21.useState)(0);
  const [balanceLoading, setBalanceLoading] = (0, import_react21.useState)(false);
  const [selectedPlan, setSelectedPlan] = (0, import_react21.useState)(null);
  const [loading, setLoading] = (0, import_react21.useState)(false);
  const [qrCode, setQrCode] = (0, import_react21.useState)(null);
  const [qrCodeImage, setQrCodeImage] = (0, import_react21.useState)(null);
  const [orderNo, setOrderNo] = (0, import_react21.useState)(null);
  const [showQrCode, setShowQrCode] = (0, import_react21.useState)(false);
  const [expiresIn, setExpiresIn] = (0, import_react21.useState)(null);
  const [platform, setPlatform] = (0, import_react21.useState)(null);
  const [timeLeft, setTimeLeft] = (0, import_react21.useState)(null);
  const [isPolling, setIsPolling] = (0, import_react21.useState)(false);
  const [countdownSeconds, setCountdownSeconds] = (0, import_react21.useState)(0);
  const [upsellCouponInfo, setUpsellCouponInfo] = (0, import_react21.useState)(null);
  const [showCouponSuccess, setShowCouponSuccess] = (0, import_react21.useState)(false);
  const [sora2Amount, setSora2Amount] = (0, import_react21.useState)(9.9);
  const [showPurchaseModal, setShowPurchaseModal] = (0, import_react21.useState)(false);
  const [purchasePlan, setPurchasePlan] = (0, import_react21.useState)(null);
  const [purchaseQty, setPurchaseQty] = (0, import_react21.useState)(12);
  const [selectedQty, setSelectedQty] = (0, import_react21.useState)({});
  const [coinPackType, setCoinPackType] = (0, import_react21.useState)("personal");
  const [selectedPersonalPlan, setSelectedPersonalPlan] = (0, import_react21.useState)("claude_code_large");
  const [selectedEnterprisePlan, setSelectedEnterprisePlan] = (0, import_react21.useState)("enterprise_growth");
  const [activePlanTab, setActivePlanTab] = (0, import_react21.useState)("personal");
  const permanentCreditBundles = getPermanentCreditBundles();
  const [selectedPermanentBundle, setSelectedPermanentBundle] = (0, import_react21.useState)(permanentCreditBundles[0]);
  const [coinPackEligible, setCoinPackEligible] = (0, import_react21.useState)(null);
  const [coinPackChecking, setCoinPackChecking] = (0, import_react21.useState)(false);
  const [enterpriseCoinPackEligible, setEnterpriseCoinPackEligible] = (0, import_react21.useState)(null);
  const [enterpriseCoinPackChecking, setEnterpriseCoinPackChecking] = (0, import_react21.useState)(false);
  const isAuthed = (0, import_react21.useCallback)(() => isAuthenticated() || DEV_BYPASS, [DEV_BYPASS]);
  (0, import_react21.useEffect)(() => {
    if (typeof window === "undefined") return;
    const allowed = /* @__PURE__ */ new Set(["experience", "personal", "enterprise", "flexible"]);
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && allowed.has(tab)) {
      setActivePlanTab(tab);
    }
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search);
      const t2 = p.get("tab");
      if (t2 && allowed.has(t2)) {
        setActivePlanTab(t2);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const setActivePlanTabWithUrl = (0, import_react21.useCallback)((tab) => {
    setActivePlanTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  const fetchPricingPlans = (0, import_react21.useCallback)(async () => {
    if (!hasLoaded) setPlansLoading(true);
    try {
      let url = "/api/pricing/v2";
      const params = new URLSearchParams();
      if (appliedCoupon?.code) {
        params.append("coupon", appliedCoupon.code);
      }
      if (useBalance) {
        params.append("use_balance", "true");
      }
      if (enterpriseTestMode) {
        params.append("enterprise_test", "1");
      }
      if (params.toString()) {
        url += "?" + params.toString();
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        const plans = Array.isArray(data.personal_plans) ? [...data.personal_plans] : [];
        if (typeof data.min_topup_cny === "number") {
          setMinTopup(data.min_topup_cny);
          setSora2Amount(data.min_topup_cny);
        }
        if (data.promotion) {
          setPromotionConfig(data.promotion);
        }
        setPoolPromoEnabled(Boolean(data.pool_promo_enabled));
        if (!plans.find((p) => p?.id === "sora2")) {
          plans.push({
            id: "sora2",
            name: "Sora2 \u4EA7\u54C1\u5305",
            description: "\u4E00\u952E\u89E3\u9501 Sora2 \u9AD8\u6E05\u89C6\u9891 \xB7 \u6309\u9700\u5145\u503C \xB7 $2 \u8D77",
            price: 9.9,
            credits: 0,
            hourly_limit: 0,
            period: "/\u8D77\u5145",
            popular: true,
            features: [
              "\u6309\u6B21\u8BA1\u8D39\uFF1A$0.02/\u6B21",
              "\u968F\u5145\u968F\u7528 \xB7 \u5230\u8D26\u5373\u7528",
              "\u652F\u6301\u591A\u955C\u5934/\u957F\u65F6\u9AD8\u6E05\u89C6\u9891\u751F\u6210",
              "\u4F18\u5148\u5904\u7406\u901A\u9053 \xB7 \u66F4\u5FEB\u51FA\u7247",
              "\u53EF\u53E0\u52A0\u5145\u503C \xB7 \u7075\u6D3B\u63A7\u5236\u6210\u672C"
            ]
          });
        }
        setPricingPlans(plans);
        if (Array.isArray(data.personal_plans)) {
          const priceMap = {};
          const creditsMap = {};
          const returnedPlanIds = /* @__PURE__ */ new Set();
          for (const p of data.personal_plans) {
            priceMap[p.id] = p.price;
            creditsMap[p.id] = p.credits || 0;
            returnedPlanIds.add(p.id);
          }
          setPersonalPrices(priceMap);
          setPersonalCredits(creditsMap);
          if (!originalPersonalPrices) {
            setOriginalPersonalPrices({ ...priceMap });
          }
        }
        if (Array.isArray(data.team_plans)) {
          const ids = /* @__PURE__ */ new Set([
            "enterprise_starter",
            "enterprise_growth",
            "enterprise_scale"
          ]);
          const priceMap = {};
          for (const p of data.team_plans) {
            if (ids.has(p.id)) {
              priceMap[p.id] = p.price;
            }
          }
          setEnterprisePlans(data.team_plans);
          setEnterprisePrices(priceMap);
          if (!originalEnterprisePrices) {
            setOriginalEnterprisePrices({ ...priceMap });
          }
          if (!originalEnterprisePlans) {
            setOriginalEnterprisePlans(data.team_plans);
          }
        } else {
          setEnterprisePlans([]);
          setEnterprisePrices({});
        }
      } else {
        setError(data.error || "\u83B7\u53D6\u5957\u9910\u4FE1\u606F\u5931\u8D25");
      }
    } catch (err) {
    } finally {
      if (!hasLoaded) {
        setPlansLoading(false);
        setHasLoaded(true);
      }
    }
  }, [appliedCoupon, useBalance, enterpriseTestMode, hasLoaded, originalPersonalPrices, originalEnterprisePrices, originalEnterprisePlans]);
  const fetchUserBalance = (0, import_react21.useCallback)(async () => {
    if (!isAuthed()) return;
    setBalanceLoading(true);
    try {
      const response = await fetch("/api/user-balance");
      const data = await response.json();
      if (data.success) {
        setCurrentBalance(data.balance || 0);
      }
    } catch (err) {
      console.error("\u83B7\u53D6\u7528\u6237\u4F59\u989D\u5931\u8D25\uFF1A", err);
    } finally {
      setBalanceLoading(false);
    }
  }, [isAuthed]);
  const applyCoupon = (0, import_react21.useCallback)(async () => {
    if (!couponCode.trim()) {
      return;
    }
    setCouponLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("coupon", encodeURIComponent(couponCode));
      if (useBalance) {
        params.append("use_balance", "true");
      }
      if (enterpriseTestMode) {
        params.append("enterprise_test", "1");
      }
      const response = await fetch(`/api/pricing/v2?${params.toString()}`);
      const data = await response.json();
      if (data.success && data.personal_plans) {
        setPricingPlans(data.personal_plans);
        if (Array.isArray(data.team_plans)) {
          const ids = /* @__PURE__ */ new Set([
            "enterprise_starter",
            "enterprise_growth",
            "enterprise_scale"
          ]);
          const priceMap = {};
          for (const p of data.team_plans) {
            if (ids.has(p.id)) {
              priceMap[p.id] = p.price;
            }
          }
          setEnterprisePlans(data.team_plans);
          setEnterprisePrices(priceMap);
        }
        setAppliedCoupon({
          code: couponCode,
          discount: data.discount || 0,
          message: data.message || "\u4F18\u60E0\u5238\u5DF2\u5E94\u7528"
        });
      }
    } catch (error2) {
      console.error("\u9A8C\u8BC1\u4F18\u60E0\u5238\u5931\u8D25:", error2);
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, useBalance, enterpriseTestMode]);
  const clearCoupon = (0, import_react21.useCallback)(() => {
    setCouponCode("");
    setAppliedCoupon(null);
    setPricingPlans([...originalPlans]);
    if (originalEnterprisePrices) {
      setEnterprisePrices({ ...originalEnterprisePrices });
    }
    if (originalEnterprisePlans) {
      setEnterprisePlans([...originalEnterprisePlans]);
    }
  }, [originalPlans, originalEnterprisePrices, originalEnterprisePlans]);
  const createOrder = (0, import_react21.useCallback)(async (plan, qtyOverride = null) => {
    if (!isAuthenticated()) {
      if (DEV_BYPASS) {
        return;
      }
      window.location.href = "/login";
      return;
    }
    setSelectedPlan(plan);
    setLoading(true);
    setError(null);
    setShowQrCode(true);
    try {
      if (plan?.id === "claude_code_coin_pack") {
        const eligible = await canBuyCoinPack();
        if (!eligible) {
          setError("\u52A0\u6CB9\u5305\u4EC5\u9650\u5F53\u524D\u5DF2\u751F\u6548\u7684\u5C0F\u6708\u5361\u53CA\u4EE5\u4E0A(\u6216\u4F01\u4E1A\u5957\u9910)\u7528\u6237\u8D2D\u4E70");
          setLoading(false);
          setSelectedPlan(null);
          try {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch (e) {
          }
          return;
        }
      }
      if (plan?.id === "enterprise_coin_pack") {
        const eligible = await canBuyEnterpriseCoinPack();
        if (!eligible) {
          setError("\u4F01\u4E1A\u52A0\u6CB9\u5305\u4EC5\u9650\u5F53\u524D\u5DF2\u751F\u6548\u7684\u6210\u957F\u56E2\u961F\u7248\u53CA\u4EE5\u4E0A\u7528\u6237\u8D2D\u4E70");
          setLoading(false);
          setSelectedPlan(null);
          try {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch (e) {
          }
          return;
        }
      }
      const qty = qtyOverride != null ? qtyOverride : selectedQty[plan.id] || 1;
      const orderData = {
        product_id: plan.id,
        use_balance: useBalance,
        quantity: qty
      };
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const bargainActivityNo = params.get("bargain");
        if (bargainActivityNo) {
          orderData.bargain_activity_no = bargainActivityNo;
        }
      }
      if (plan.id === "subscription_openclaw") {
        orderData.days = plan.days;
      } else if (plan.id === "sora2") {
        const v = parseFloat(sora2Amount || 0);
        if (isNaN(v) || v < minTopup) {
          setError(`\u8BF7\u8F93\u5165\u5408\u6CD5\u7684\u5145\u503C\u91D1\u989D(\u6700\u4F4E \xA5${minTopup})`);
          setLoading(false);
          setSelectedPlan(null);
          return;
        }
        orderData.custom_price = v.toFixed(2);
        orderData.use_balance = false;
        delete orderData.quantity;
      } else if (plan.id === "pool_promo") {
        orderData.product_id = "pool_promo";
        orderData.custom_price = plan.customPrice;
        orderData.use_balance = false;
        delete orderData.quantity;
      } else if (plan.id === "permanent_credits") {
        const amount = Number(plan.price ?? plan.amount ?? 0);
        if (Number.isNaN(amount) || amount <= 0) {
          setError("\u8BF7\u9009\u62E9Token\u5957\u9910\u91D1\u989D");
          setLoading(false);
          setSelectedPlan(null);
          return;
        }
        orderData.amount = amount;
        orderData.use_balance = false;
        delete orderData.quantity;
      } else if (plan.id === "flexible_topup") {
        const amount = Number(plan.price ?? plan.amount ?? 0);
        if (Number.isNaN(amount) || amount <= 0) {
          setError("\u8BF7\u8F93\u5165\u5145\u503C\u91D1\u989D");
          setLoading(false);
          setSelectedPlan(null);
          return;
        }
        orderData.amount = amount;
        orderData.use_balance = false;
        delete orderData.quantity;
      }
      if (appliedCoupon && plan.id !== "sora2" && plan.id !== "flexible_topup") {
        orderData.coupon_code = appliedCoupon.code;
      }
      if (plan.metadata) {
        orderData.metadata = plan.metadata;
      }
      if (plan.test) {
        orderData.test_price = true;
      }
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) {
        const orderResult2 = await response.json().catch(() => ({}));
        if (plan.id === "claude_code_oneday") {
          setError("\u5355\u65E5\u4F53\u9A8C\u5361\u4E3A\u65B0\u7528\u6237\u4E13\u4EAB");
        } else {
          setError("\u521B\u5EFA\u8BA2\u5355\u5931\u8D25: " + (orderResult2.error || "\u672A\u77E5\u9519\u8BEF"));
        }
        setSelectedPlan(null);
        setShowQrCode(false);
        return;
      }
      const orderResult = await response.json();
      if (orderResult.data && orderResult.data.paid_by_balance) {
        fetchUserBalance();
        setTimeout(() => {
          window.location.href = `/console/wallet`;
        }, 2e3);
        return;
      }
      if (orderResult.data && orderResult.data.qr_code) {
        setQrCode(orderResult.data.qr_code);
        setOrderNo(orderResult.data.order_no);
        setExpiresIn(orderResult.data.expires_in);
        setPlatform(orderResult.data.platform);
        setShowQrCode(true);
        return;
      }
      if (orderResult.data && orderResult.data.checkout_url) {
        window.location.href = orderResult.data.checkout_url;
        return;
      }
      if (orderResult.data) {
        window.location.href = `/console/wallet`;
      }
    } catch (err) {
      setError("\u7F51\u7EDC\u9519\u8BEF\uFF1A" + err.message);
      setSelectedPlan(null);
      setShowQrCode(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, DEV_BYPASS, selectedQty, useBalance, sora2Amount, minTopup, appliedCoupon, fetchUserBalance]);
  const closeQrModal = (0, import_react21.useCallback)(() => {
    setShowQrCode(false);
    setQrCode(null);
    setQrCodeImage(null);
    setOrderNo(null);
    setExpiresIn(null);
    setPlatform(null);
    setTimeLeft(null);
    setIsPolling(false);
    setCountdownSeconds(0);
  }, []);
  const openPurchaseModal = (0, import_react21.useCallback)((plan) => {
    setPurchasePlan(plan);
    const current = selectedQty[plan.id] || 1;
    setPurchaseQty(current > 1 ? current : 12);
    setShowPurchaseModal(true);
  }, [selectedQty]);
  (0, import_react21.useEffect)(() => {
    if (qrCode) {
      import_qrcode.default.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      }).then((url) => {
        setQrCodeImage(url);
      }).catch((err) => {
        console.error("\u751F\u6210\u4E8C\u7EF4\u7801\u5931\u8D25:", err);
      });
    }
  }, [qrCode]);
  (0, import_react21.useEffect)(() => {
    if (expiresIn) {
      const expireTime = parseInt(expiresIn);
      setTimeLeft(expireTime);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            closeQrModal();
            return 0;
          }
          return prev - 1;
        });
      }, 1e3);
      return () => clearInterval(timer);
    }
  }, [expiresIn, closeQrModal]);
  (0, import_react21.useEffect)(() => {
    let pollTimer = null;
    if (showQrCode && orderNo) {
      setIsPolling(true);
      pollTimer = setInterval(async () => {
        try {
          const response = await fetch(`/api/order/query?order_id=${orderNo}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          });
          if (!response.ok) {
            return;
          }
          const result = await response.json();
          if (!(result.success && result.data)) {
            return;
          }
          const status = result.data.status;
          if (status === "success" || status === "payed") {
            clearInterval(pollTimer);
            setIsPolling(false);
            const isUpsellOrder = selectedPlan?.metadata?.source === "upsell_modal";
            if (isUpsellOrder) {
              closeQrModal();
              fetchUserBalance();
              let retries = 0;
              const maxRetries = 5;
              const couponPollTimer = setInterval(async () => {
                retries++;
                try {
                  const couponResp = await fetch(`/api/order/upsell-coupon?order_no=${orderNo}`);
                  if (couponResp.ok) {
                    const couponResult = await couponResp.json();
                    if (couponResult.success && couponResult.data?.has_coupon) {
                      clearInterval(couponPollTimer);
                      setUpsellCouponInfo(couponResult.data);
                      setShowCouponSuccess(true);
                      return;
                    }
                  }
                } catch (e) {
                  console.error("\u67E5\u8BE2\u4F18\u60E0\u5238\u5931\u8D25:", e);
                }
                if (retries >= maxRetries) {
                  clearInterval(couponPollTimer);
                  window.location.href = `/console/wallet`;
                }
              }, 2e3);
            } else {
              setCountdownSeconds(3);
              const countdownTimer = setInterval(() => {
                setCountdownSeconds((prev) => {
                  if (prev <= 1) {
                    clearInterval(countdownTimer);
                    closeQrModal();
                    fetchUserBalance();
                    window.location.href = `/console/wallet`;
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1e3);
            }
            return;
          }
          if (status === "expire" || status === "not_exist") {
            clearInterval(pollTimer);
            setIsPolling(false);
            closeQrModal();
          }
        } catch (error2) {
          console.error("\u8F6E\u8BE2\u652F\u4ED8\u72B6\u6001\u5931\u8D25:", error2);
        }
      }, 5e3);
    } else {
      setIsPolling(false);
    }
    return () => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      setIsPolling(false);
    };
  }, [showQrCode, orderNo, closeQrModal, fetchUserBalance]);
  (0, import_react21.useEffect)(() => {
    if (typeof window === "undefined") return;
    const handleKeyPress = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      if (e.key >= "0" && e.key <= "9") {
        setKeySequence((prev) => {
          const newSeq = (prev + e.key).slice(-6);
          if (newSeq === "888888") {
            setShowCouponInput(true);
            setTimeout(() => setKeySequence(""), 100);
            return "";
          }
          return newSeq;
        });
      }
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, []);
  (0, import_react21.useEffect)(() => {
    if (isAuthed()) {
      fetchPricingPlans();
    }
  }, [useBalance, isAuthed, fetchPricingPlans]);
  (0, import_react21.useEffect)(() => {
    if (pricingPlans && pricingPlans.length > 0 && originalPlans.length === 0) {
      setOriginalPlans([...pricingPlans]);
    }
  }, [pricingPlans, originalPlans.length]);
  (0, import_react21.useEffect)(() => {
    fetchPricingPlans();
    fetchUserBalance();
    if (isAuthenticated()) {
      (async () => {
        try {
          setCoinPackChecking(true);
          const ok = await canBuyCoinPack();
          setCoinPackEligible(!!ok);
        } catch (e) {
          setCoinPackEligible(false);
        } finally {
          setCoinPackChecking(false);
        }
      })();
      (async () => {
        try {
          setEnterpriseCoinPackChecking(true);
          const ok = await canBuyEnterpriseCoinPack();
          setEnterpriseCoinPackEligible(!!ok);
        } catch (e) {
          setEnterpriseCoinPackEligible(false);
        } finally {
          setEnterpriseCoinPackChecking(false);
        }
      })();
    }
  }, [fetchPricingPlans, fetchUserBalance]);
  return {
    // 套餐数据
    plans: {
      personal: pricingPlans || [],
      enterprise: enterprisePlans,
      hidden: hiddenPlans,
      loading: plansLoading,
      hasLoaded
    },
    prices: {
      personal: personalPrices,
      enterprise: enterprisePrices,
      originalPersonal: originalPersonalPrices,
      originalEnterprise: originalEnterprisePrices,
      minTopup
    },
    credits: {
      personal: personalCredits
    },
    // 积分展示配置
    creditDisplay,
    // 促销活动配置
    promotionConfig,
    // Pool 促销包灰度
    poolPromoEnabled,
    // 优惠券
    coupon: {
      code: couponCode,
      setCode: setCouponCode,
      applied: appliedCoupon,
      loading: couponLoading,
      apply: applyCoupon,
      clear: clearCoupon,
      showInput: showCouponInput,
      setShowInput: setShowCouponInput
    },
    // 余额
    balance: {
      current: currentBalance,
      enabled: useBalance,
      setEnabled: setUseBalance,
      loading: balanceLoading
    },
    // 支付
    payment: {
      loading,
      qrCode,
      qrCodeImage,
      orderNo,
      showQrCode,
      expiresIn,
      platform,
      timeLeft,
      isPolling,
      countdownSeconds,
      selectedPlan,
      close: closeQrModal,
      // UpsellModal 优惠券
      upsellCouponInfo,
      showCouponSuccess,
      setShowCouponSuccess
    },
    // UI 状态
    ui: {
      activePlanTab,
      setActivePlanTab: setActivePlanTabWithUrl,
      showPurchaseModal,
      setShowPurchaseModal,
      purchasePlan,
      purchaseQty,
      setPurchaseQty,
      sora2Amount,
      setSora2Amount,
      selectedQty,
      setSelectedQty,
      coinPackType,
      setCoinPackType,
      selectedPersonalPlan,
      setSelectedPersonalPlan,
      selectedEnterprisePlan,
      setSelectedEnterprisePlan,
      selectedPermanentBundle,
      setSelectedPermanentBundle
    },
    // 资格检查
    eligibility: {
      coinPack: coinPackEligible,
      coinPackChecking,
      enterpriseCoinPack: enterpriseCoinPackEligible,
      enterpriseCoinPackChecking
    },
    // 错误
    error,
    setError,
    // 方法
    fetchPlans: fetchPricingPlans,
    fetchUserBalance,
    createOrder,
    openPurchaseModal,
    closeQrModal,
    isAuthed,
    // 常量
    permanentCreditBundles
  };
}

// frontend/components/pricing/PricingSectionTabs.jsx
var import_react22 = __toESM(require_react());
function PricingSectionTabs({ sections, stickyTop = 72, scrollOffset = 120, sticky = true, align = "start" }) {
  const [active, setActive] = (0, import_react22.useState)(sections[0]?.id || "");
  const suppressObserverRef = (0, import_react22.useRef)(false);
  const suppressTimerRef = (0, import_react22.useRef)(null);
  const scrollToSection = (0, import_react22.useCallback)(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      suppressObserverRef.current = true;
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
      const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top, behavior: "smooth" });
      setActive(id);
      try {
        window.history.replaceState(null, "", `#${id}`);
      } catch (e) {
      }
      suppressTimerRef.current = setTimeout(() => {
        suppressObserverRef.current = false;
      }, 800);
    },
    [scrollOffset]
  );
  (0, import_react22.useEffect)(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && sections.some((s) => s.id === hash)) {
      requestAnimationFrame(() => scrollToSection(hash));
    }
  }, []);
  (0, import_react22.useEffect)(() => {
    const observers = [];
    const onIntersect = (entries) => {
      if (suppressObserverRef.current) return;
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) {
        setActive(visible[0].target.id);
      }
    };
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const obs = new IntersectionObserver(onIntersect, {
        rootMargin: `-${scrollOffset + 1}px 0px -50% 0px`,
        threshold: 0
      });
      obs.observe(el);
      observers.push(obs);
    });
    return () => {
      observers.forEach((o) => o.disconnect());
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    };
  }, [sections, scrollOffset]);
  return /* @__PURE__ */ import_react22.default.createElement(
    "div",
    {
      className: "pricing-section-tabs",
      style: sticky ? {
        position: "sticky",
        top: stickyTop,
        zIndex: 30,
        backgroundColor: "var(--term-bg, #0a0a0a)",
        borderBottom: "1px solid var(--term-border, #1a3f1a)"
      } : void 0
    },
    /* @__PURE__ */ import_react22.default.createElement("div", { className: sticky ? "max-w-[1440px] mx-auto px-site-margin" : "" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: `flex items-center gap-2 ${sticky ? "py-2" : ""} ${align === "end" ? "justify-end" : ""}` }, sections.map((s) => {
      const isActive = s.id === active;
      return /* @__PURE__ */ import_react22.default.createElement(
        "button",
        {
          key: s.id,
          type: "button",
          onClick: () => scrollToSection(s.id),
          className: `px-5 py-2 text-sm font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap ${isActive ? "border-[var(--term-primary,#00aa00)] bg-[var(--term-primary,#00aa00)] text-black font-semibold" : "border-transparent text-[var(--term-secondary,#cc8a00)] hover:border-[var(--term-primary,#00aa00)] hover:text-[var(--term-primary,#00aa00)]"}`
        },
        s.label
      );
    })))
  );
}

// frontend/components/models/ModelsSection.jsx
var import_react25 = __toESM(require_react());

// frontend/components/models/ModelCard.jsx
var import_react23 = __toESM(require_react());
function ModelCard({ model }) {
  const t2 = getTranslations("pricing", {});
  const {
    id,
    name,
    description,
    contextWindow,
    maxOutput,
    pricing,
    features = [],
    available = true,
    endpoints = []
  } = model;
  const [copied, setCopied] = (0, import_react23.useState)(false);
  const handleCopyId = (0, import_react23.useCallback)((e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [id]);
  return /* @__PURE__ */ import_react23.default.createElement("div", { className: `term-window p-4 md:p-5 flex flex-col group ${!available ? "opacity-60" : ""}` }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "term-window-title -mx-4 md:-mx-5 -mt-4 md:-mt-5 mb-4 flex items-center justify-between" }, /* @__PURE__ */ import_react23.default.createElement(
    "button",
    {
      onClick: handleCopyId,
      className: "truncate flex items-center gap-1.5 hover:text-[var(--term-secondary)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit text-left",
      title: "Click to copymodel ID"
    },
    /* @__PURE__ */ import_react23.default.createElement("span", { className: "truncate" }, "[", id, "]"),
    copied ? /* @__PURE__ */ import_react23.default.createElement(Check, { className: "h-3.5 w-3.5 text-[var(--term-secondary)] flex-shrink-0" }) : /* @__PURE__ */ import_react23.default.createElement(Copy, { className: "h-3.5 w-3.5 opacity-60 flex-shrink-0" })
  ), available ? /* @__PURE__ */ import_react23.default.createElement(Check, { className: "h-4 w-4 text-[var(--term-secondary)] flex-shrink-0" }) : /* @__PURE__ */ import_react23.default.createElement(X, { className: "h-4 w-4 text-red-500 flex-shrink-0" })), /* @__PURE__ */ import_react23.default.createElement("div", { className: "mb-3" }, /* @__PURE__ */ import_react23.default.createElement("h3", { className: "text-lg font-bold text-[var(--term-primary)] mb-1" }, name), description && /* @__PURE__ */ import_react23.default.createElement("p", { className: "text-sm text-[#c0f2b6] line-clamp-2" }, description)), /* @__PURE__ */ import_react23.default.createElement("div", { className: "hidden term-panel p-3 mb-4 border border-[var(--term-muted)] text-sm space-y-2" }, contextWindow && /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react23.default.createElement(FileText, { className: "h-3.5 w-3.5 text-[var(--term-secondary)]" }), /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[#8ad67c]" }, "Context")), /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[var(--term-primary)] font-semibold" }, formatNumber(contextWindow))), maxOutput && /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react23.default.createElement(Zap, { className: "h-3.5 w-3.5 text-[var(--term-secondary)]" }), /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[#8ad67c]" }, "Max Output")), /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[var(--term-primary)] font-semibold" }, formatNumber(maxOutput)))), pricing && (pricing.input != null || pricing.output != null) && /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex items-center gap-3 mb-3 text-xs font-mono" }, pricing.input != null && /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[#8ad67c]" }, "In ", /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[#c0f2b6]" }, "$", pricing.input)), pricing.output != null && /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[#8ad67c]" }, "Out ", /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[#c0f2b6]" }, "$", pricing.output)), /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[var(--term-muted)] text-[10px]" }, "/MTok"), /* @__PURE__ */ import_react23.default.createElement("span", { className: "ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-[var(--term-secondary)]/15 border border-[var(--term-secondary)] text-[var(--term-secondary)] whitespace-nowrap leading-none" }, t2.models?.discountBadge || "From 81% off")), features.length > 0 && /* @__PURE__ */ import_react23.default.createElement("div", { className: "space-y-2 mb-4 flex-1" }, features.map((feature, index) => /* @__PURE__ */ import_react23.default.createElement("div", { key: index, className: "flex items-start gap-2 text-sm text-[#c0f2b6]" }, /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[var(--term-primary)] mt-0.5" }, ">"), /* @__PURE__ */ import_react23.default.createElement("span", null, feature)))), endpoints.length > 0 && /* @__PURE__ */ import_react23.default.createElement("div", { className: "mb-4 pb-3 border-b border-[var(--term-muted)]" }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "text-xs text-[var(--term-muted)] mb-2" }, "supportAPI:"), /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex flex-wrap gap-1" }, endpoints.map((endpoint, index) => /* @__PURE__ */ import_react23.default.createElement(
    "span",
    {
      key: index,
      className: "px-2 py-0.5 text-xs bg-[var(--term-muted)]/20 border border-[var(--term-muted)] text-[#8ad67c]"
    },
    endpoint
  )))), /* @__PURE__ */ import_react23.default.createElement("div", { className: "mt-auto pt-3 border-t border-[var(--term-muted)]" }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex items-center justify-between text-xs" }, /* @__PURE__ */ import_react23.default.createElement("span", { className: "text-[var(--term-muted)]" }, "Status:"), /* @__PURE__ */ import_react23.default.createElement("span", { className: available ? "text-[var(--term-secondary)]" : "text-red-500" }, available ? "[AVAILABLE]" : "[UNAVAILABLE]"))));
}
function formatNumber(num) {
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(0)}K`;
  }
  return num.toString();
}

// frontend/components/models/ModelFilters.jsx
var import_react24 = __toESM(require_react());
function ModelFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange
}) {
  return /* @__PURE__ */ import_react24.default.createElement("div", { className: "mb-6" }, /* @__PURE__ */ import_react24.default.createElement("div", { className: "term-window p-4" }, /* @__PURE__ */ import_react24.default.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ import_react24.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react24.default.createElement(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--term-muted)]" }), /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "text",
      value: searchQuery,
      onChange: (e) => onSearchChange(e.target.value),
      placeholder: "Search models...",
      className: "w-full pl-10 pr-4 py-2 bg-[var(--term-bg)] border border-[var(--term-muted)] text-[var(--term-primary)] placeholder:text-[var(--term-muted)] focus:border-[var(--term-secondary)] focus:outline-none transition-colors text-sm"
    }
  )), /* @__PURE__ */ import_react24.default.createElement("div", { className: "flex flex-wrap gap-2" }, categories.map((category) => /* @__PURE__ */ import_react24.default.createElement(
    "button",
    {
      key: category,
      onClick: () => onCategoryChange(category),
      className: `px-3 py-1.5 text-xs font-semibold border transition-colors ${selectedCategory === category ? "border-[var(--term-secondary)] bg-[var(--term-secondary)] text-black" : "border-[var(--term-muted)] text-[#8ad67c] hover:border-[var(--term-primary)] hover:text-[var(--term-primary)]"}`
    },
    getCategoryLabel(category)
  ))))));
}
function getCategoryLabel(category) {
  const labels = {
    all: "All",
    claude: "Claude",
    gpt: "GPT",
    gemini: "Gemini",
    other: "Other"
  };
  return labels[category] || category;
}

// frontend/components/models/ModelsSection.jsx
function ModelsSection() {
  const [models, setModels] = (0, import_react25.useState)([]);
  const [loading, setLoading] = (0, import_react25.useState)(true);
  const [error, setError] = (0, import_react25.useState)(null);
  const [selectedCategory, setSelectedCategory] = (0, import_react25.useState)("all");
  const [searchQuery, setSearchQuery] = (0, import_react25.useState)("");
  const [copiedCategory, setCopiedCategory] = (0, import_react25.useState)(null);
  const handleCopyCategory = (0, import_react25.useCallback)((category, categoryModels) => {
    const ids = categoryModels.map((m) => m.id).join("\n");
    navigator.clipboard.writeText(ids).then(() => {
      setCopiedCategory(category);
      setTimeout(() => setCopiedCategory(null), 1500);
    });
  }, []);
  (0, import_react25.useEffect)(() => {
    const loadModels = async () => {
      setLoading(true);
      setError(null);
      try {
        setModels(MODEL_CATALOG);
      } catch (err) {
        console.error("Failed to load models:", err);
        setError(err.message);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };
    loadModels();
  }, []);
  const categories = import_react25.default.useMemo(() => {
    const cats = new Set(models.map((m) => m.category || "other"));
    return ["all", ...Array.from(cats).sort()];
  }, [models]);
  const filteredModels = import_react25.default.useMemo(() => {
    return models.filter((model) => {
      const matchesCategory = selectedCategory === "all" || model.category === selectedCategory;
      const matchesSearch = !searchQuery || model.name.toLowerCase().includes(searchQuery.toLowerCase()) || model.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [models, selectedCategory, searchQuery]);
  const groupedModels = import_react25.default.useMemo(() => {
    const groups = {};
    filteredModels.forEach((model) => {
      const cat = model.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(model);
    });
    return groups;
  }, [filteredModels]);
  return /* @__PURE__ */ import_react25.default.createElement("div", null, /* @__PURE__ */ import_react25.default.createElement(
    ModelFilters,
    {
      categories,
      selectedCategory,
      onCategoryChange: setSelectedCategory,
      searchQuery,
      onSearchChange: setSearchQuery
    }
  ), loading && /* @__PURE__ */ import_react25.default.createElement("div", { className: "term-window p-8 text-center" }, /* @__PURE__ */ import_react25.default.createElement("div", { className: "text-[var(--term-secondary)] mb-2" }, /* @__PURE__ */ import_react25.default.createElement("span", { className: "animate-pulse" }, "> loading models..."))), !loading && filteredModels.length === 0 && /* @__PURE__ */ import_react25.default.createElement("div", { className: "term-window p-8 text-center" }, /* @__PURE__ */ import_react25.default.createElement("p", { className: "text-[var(--term-muted)] mb-2" }, "No models found"), /* @__PURE__ */ import_react25.default.createElement("p", { className: "text-[#8ad67c] text-sm" }, "Try adjusting your filters or search query")), !loading && Object.keys(groupedModels).length > 0 && /* @__PURE__ */ import_react25.default.createElement("div", { className: "space-y-8" }, Object.entries(groupedModels).map(([category, categoryModels]) => /* @__PURE__ */ import_react25.default.createElement("div", { key: category }, /* @__PURE__ */ import_react25.default.createElement("div", { className: "term-window-title mb-4 flex items-center justify-between" }, /* @__PURE__ */ import_react25.default.createElement("span", null, "+-- ", getCategoryLabel2(category), " (", categoryModels.length, ") --+"), /* @__PURE__ */ import_react25.default.createElement(
    "button",
    {
      onClick: () => handleCopyCategory(category, categoryModels),
      className: "flex items-center gap-1 text-xs text-[var(--term-muted)] hover:text-[var(--term-secondary)] transition-colors cursor-pointer bg-transparent border-none p-0",
      title: `Copy ${getCategoryLabel2(category)} All TimeModel ID`
    },
    copiedCategory === category ? /* @__PURE__ */ import_react25.default.createElement(import_react25.default.Fragment, null, /* @__PURE__ */ import_react25.default.createElement(Check, { className: "h-3 w-3" }), " Copied") : /* @__PURE__ */ import_react25.default.createElement(import_react25.default.Fragment, null, /* @__PURE__ */ import_react25.default.createElement(Copy, { className: "h-3 w-3" }), " Copy")
  )), /* @__PURE__ */ import_react25.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" }, categoryModels.map((model) => /* @__PURE__ */ import_react25.default.createElement(ModelCard, { key: model.id, model })))))));
}
function getCategoryLabel2(category) {
  const labels = {
    claude: "Claude Models",
    gpt: "GPT Models",
    gemini: "Gemini Models",
    other: "Other Models",
    all: "All Models"
  };
  return labels[category] || category;
}

// frontend/components/models/ModelPricingTable.jsx
var import_react26 = __toESM(require_react());
var claudePricingData = [
  { model: "Claude Fable 5", input: 10, cacheWrite5m: 12.5, cacheWrite1h: 20, cacheHit: 1, output: 50 },
  { model: "Claude Opus 5.5", input: 4, cacheWrite5m: 5, cacheWrite1h: 8, cacheHit: 0.2, output: 20 },
  { model: "Claude Opus 5", input: 5, cacheWrite5m: 6.25, cacheWrite1h: 10, cacheHit: 0.5, output: 25 },
  { model: "Claude Opus 4.8", input: 5, cacheWrite5m: 6.25, cacheWrite1h: 10, cacheHit: 0.5, output: 25 },
  { model: "Claude Opus 4.7", input: 5, cacheWrite5m: 6.25, cacheWrite1h: 10, cacheHit: 0.5, output: 25 },
  { model: "Claude Opus 4.6", input: 5, cacheWrite5m: 6.25, cacheWrite1h: 10, cacheHit: 0.5, output: 25 },
  { model: "Claude Opus 4.5", input: 5, cacheWrite5m: 6.25, cacheWrite1h: 10, cacheHit: 0.5, output: 25 },
  { model: "Claude Opus 4.1", input: 15, cacheWrite5m: 18.75, cacheWrite1h: 30, cacheHit: 1.5, output: 75 },
  { model: "Claude Opus 4", input: 15, cacheWrite5m: 18.75, cacheWrite1h: 30, cacheHit: 1.5, output: 75 },
  { model: "Claude Sonnet 5.5", input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheHit: 0.2, output: 10 },
  { model: "Claude Sonnet 4.6", input: 3, cacheWrite5m: 3.75, cacheWrite1h: 6, cacheHit: 0.3, output: 15 },
  { model: "Claude Sonnet 4.5", input: 3, cacheWrite5m: 3.75, cacheWrite1h: 6, cacheHit: 0.3, output: 15 },
  { model: "Claude Sonnet 4", input: 3, cacheWrite5m: 3.75, cacheWrite1h: 6, cacheHit: 0.3, output: 15 },
  { model: "Claude Sonnet 3.7", input: 3, cacheWrite5m: 3.75, cacheWrite1h: 6, cacheHit: 0.3, output: 15, deprecated: true },
  { model: "Claude Haiku 4.5", input: 1, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheHit: 0.1, output: 5 },
  { model: "Claude Haiku 3.5", input: 0.8, cacheWrite5m: 1, cacheWrite1h: 1.6, cacheHit: 0.08, output: 4 },
  { model: "Claude Opus 3", input: 15, cacheWrite5m: 18.75, cacheWrite1h: 30, cacheHit: 1.5, output: 75, deprecated: true },
  { model: "Claude Haiku 3", input: 0.25, cacheWrite5m: 0.3, cacheWrite1h: 0.5, cacheHit: 0.03, output: 1.25 }
];
var gptPricingData = [
  { model: "GPT-6.1 Sol", input: 2, cachedInput: 0.1, output: 10, longInput: 4, longCachedInput: 0.2, longOutput: 15 },
  { model: "GPT-6 Astra", input: 10, cachedInput: 1, output: 50 },
  { model: "GPT-5.6 Sol", input: 5, cachedInput: 0.5, output: 30 },
  { model: "GPT-5.6 Terra", input: 2, cachedInput: 0.2, output: 12 },
  { model: "GPT-5.4", input: 2.5, cachedInput: 0.25, output: 15, longInput: 5, longCachedInput: 0.5, longOutput: 22.5 },
  { model: "GPT-5.3 Codex", input: 1.75, cachedInput: 0.175, output: 14 },
  { model: "GPT-5.2 Codex", input: 1.75, cachedInput: 0.175, output: 14 },
  { model: "GPT-5.1 Codex Max", input: 1.25, cachedInput: 0.125, output: 10 }
];
function formatPrice(val) {
  return `$${val}`;
}
function PricingTable({ title, titleTag, linkUrl, linkText, headers, data, renderRow, footnote }) {
  return /* @__PURE__ */ import_react26.default.createElement("div", { className: "term-window p-4 md:p-5" }, /* @__PURE__ */ import_react26.default.createElement("div", { className: "term-window-title -mx-4 md:-mx-5 -mt-4 md:-mt-5 mb-4 flex items-center justify-between" }, /* @__PURE__ */ import_react26.default.createElement("span", null, "+-- ", titleTag, " --+"), /* @__PURE__ */ import_react26.default.createElement(
    "a",
    {
      href: linkUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "flex items-center gap-1 text-xs text-[var(--term-muted)] hover:text-[var(--term-secondary)] transition-colors no-underline"
    },
    /* @__PURE__ */ import_react26.default.createElement("span", null, linkText),
    /* @__PURE__ */ import_react26.default.createElement(ExternalLink, { className: "h-3 w-3" })
  )), /* @__PURE__ */ import_react26.default.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ import_react26.default.createElement("table", { className: "w-full text-sm border-collapse" }, /* @__PURE__ */ import_react26.default.createElement("thead", null, /* @__PURE__ */ import_react26.default.createElement("tr", { className: "text-[var(--term-secondary)] border-b border-[var(--term-muted)]" }, headers.map((h, i) => /* @__PURE__ */ import_react26.default.createElement(
    "th",
    {
      key: i,
      className: `py-2 font-semibold whitespace-nowrap ${i === 0 ? "text-left pr-4" : "text-right px-3"} ${h.hideOn || ""}`
    },
    h.label
  )))), /* @__PURE__ */ import_react26.default.createElement("tbody", null, data.map((row, i) => renderRow(row, i))))), /* @__PURE__ */ import_react26.default.createElement("div", { className: "mt-3 text-xs text-[var(--term-muted)]" }, /* @__PURE__ */ import_react26.default.createElement("span", { className: "text-[var(--term-secondary)]" }, ">"), " ", footnote));
}
function ModelPricingTable() {
  return /* @__PURE__ */ import_react26.default.createElement("div", { className: "mb-10 space-y-6" }, /* @__PURE__ */ import_react26.default.createElement(
    PricingTable,
    {
      titleTag: "claude model pricing",
      linkUrl: "https://platform.claude.com/docs/zh-CN/about-claude/pricing",
      linkText: "officialpricing",
      headers: [
        { label: "Model" },
        { label: "Base Input" },
        { label: "5m Cache Write", hideOn: "hidden md:table-cell" },
        { label: "1h Cache Write", hideOn: "hidden lg:table-cell" },
        { label: "Cache Hit", hideOn: "hidden md:table-cell" },
        { label: "Output" }
      ],
      data: claudePricingData,
      renderRow: (row, i) => /* @__PURE__ */ import_react26.default.createElement(
        "tr",
        {
          key: row.model,
          className: `border-b border-[var(--term-muted)]/30 ${row.deprecated ? "opacity-50" : ""} ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`
        },
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 pr-4 text-[var(--term-primary)] whitespace-nowrap" }, row.model, row.deprecated && /* @__PURE__ */ import_react26.default.createElement("span", { className: "ml-2 text-xs text-red-500/80" }, "(deprecated)")),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[#c0f2b6] whitespace-nowrap font-mono" }, formatPrice(row.input)),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[#c0f2b6] whitespace-nowrap font-mono hidden md:table-cell" }, formatPrice(row.cacheWrite5m)),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[#c0f2b6] whitespace-nowrap font-mono hidden lg:table-cell" }, formatPrice(row.cacheWrite1h)),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[var(--term-secondary)] whitespace-nowrap font-mono hidden md:table-cell" }, formatPrice(row.cacheHit)),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[#8ad67c] whitespace-nowrap font-mono" }, formatPrice(row.output))
      ),
      footnote: "pricesingle : USD / MTok (million tokens)"
    }
  ), /* @__PURE__ */ import_react26.default.createElement(
    PricingTable,
    {
      titleTag: "openai gpt model pricing",
      linkUrl: "https://developers.openai.com/api/docs/pricing",
      linkText: "officialpricing",
      headers: [
        { label: "Model" },
        { label: "Input" },
        { label: "Cached Input", hideOn: "hidden md:table-cell" },
        { label: "Output" },
        { label: "Long Input", hideOn: "hidden lg:table-cell" },
        { label: "Long Cached", hideOn: "hidden lg:table-cell" },
        { label: "Long Output", hideOn: "hidden lg:table-cell" }
      ],
      data: gptPricingData,
      renderRow: (row, i) => /* @__PURE__ */ import_react26.default.createElement(
        "tr",
        {
          key: row.model,
          className: `border-b border-[var(--term-muted)]/30 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`
        },
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 pr-4 text-[var(--term-primary)] whitespace-nowrap" }, row.model),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[#c0f2b6] whitespace-nowrap font-mono" }, formatPrice(row.input)),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[var(--term-secondary)] whitespace-nowrap font-mono hidden md:table-cell" }, formatPrice(row.cachedInput)),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[#8ad67c] whitespace-nowrap font-mono" }, formatPrice(row.output)),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[#c0f2b6] whitespace-nowrap font-mono hidden lg:table-cell" }, row.longInput ? formatPrice(row.longInput) : /* @__PURE__ */ import_react26.default.createElement("span", { className: "text-[var(--term-muted)]" }, "-")),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[var(--term-secondary)] whitespace-nowrap font-mono hidden lg:table-cell" }, row.longCachedInput ? formatPrice(row.longCachedInput) : /* @__PURE__ */ import_react26.default.createElement("span", { className: "text-[var(--term-muted)]" }, "-")),
        /* @__PURE__ */ import_react26.default.createElement("td", { className: "py-2 px-3 text-right text-[#8ad67c] whitespace-nowrap font-mono hidden lg:table-cell" }, row.longOutput ? formatPrice(row.longOutput) : /* @__PURE__ */ import_react26.default.createElement("span", { className: "text-[var(--term-muted)]" }, "-"))
      ),
      footnote: "pricesingle : USD / MTok (million tokens) | Long context: >128K tokens"
    }
  ));
}

// frontend/utils/pricing.js
function formatPrice2(price) {
  if (typeof price !== "number") return "0";
  return Number(price.toFixed(2)).toString();
}
function calcBulkNumbers(plan, qty) {
  if (!plan) {
    return { total: 0, discounted: 0, perMonth: 0, save: 0, tag: "" };
  }
  const price = typeof plan.price === "number" && !Number.isNaN(plan.price) ? plan.price : Number(plan.price || 0);
  const id = plan.id || "";
  const normalizedQty = typeof qty === "number" && qty > 0 ? qty : 1;
  let rate = 1;
  let tag = "";
  const isEnterprise = id.startsWith("enterprise_") && id !== "enterprise_coin_pack";
  if (id === "claude_code_coin_pack") {
    if (normalizedQty === 2) {
      const discount = COIN_PACK_DISCOUNT[2];
      rate = discount.rate;
      tag = discount.tag;
    } else if (normalizedQty >= 3) {
      const discount = COIN_PACK_DISCOUNT[3];
      rate = discount.rate;
      tag = discount.tag;
    }
  } else if (id === "enterprise_coin_pack") {
    rate = 1;
    tag = "";
  } else {
    const discount = DISCOUNT_CONFIG[normalizedQty];
    if (discount) {
      rate = discount.rate;
      tag = discount.tag;
    }
  }
  const total = price * normalizedQty;
  const discounted = Math.round(total * rate * 100) / 100;
  const perMonth = normalizedQty > 0 ? Math.round(discounted / normalizedQty * 100) / 100 : 0;
  const save = Math.round((total - discounted) * 100) / 100;
  return { total, discounted, perMonth, save, tag };
}
function formatTime(seconds) {
  if (!seconds) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// frontend/pages/Pricing.jsx
function Pricing() {
  const DEV_BYPASS = typeof window !== "undefined" && ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (new URLSearchParams(window.location.search).has("dev") || localStorage.getItem("dev_pricing_preview") === "1"));
  const enterpriseTestMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("enterprise_test");
  const scanlineEnabled = typeof window === "undefined" || new URLSearchParams(window.location.search).get("scanline") !== "0";
  const softTextureEnabled = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("texture") !== "0";
  const textureMode = scanlineEnabled ? "scanline" : softTextureEnabled ? "soft" : "flat";
  const pricing = usePricing({ DEV_BYPASS, enterpriseTestMode });
  const t2 = getTranslations("pricing", {});
  const [flexibleTopupAmount, setFlexibleTopupAmount] = import_react27.default.useState(10);
  const getInitialTab = () => {
    if (typeof window === "undefined") return "topup";
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const validTabs = ["topup", "subscription", "openclaw"];
    return validTabs.includes(tabParam) ? tabParam : "topup";
  };
  const [topupSubscriptionTab, setTopupSubscriptionTab] = import_react27.default.useState(getInitialTab());
  import_react27.default.useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const validTabs = ["topup", "subscription", "openclaw"];
      if (validTabs.includes(tabParam) && tabParam !== topupSubscriptionTab) {
        setTopupSubscriptionTab(tabParam);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [topupSubscriptionTab]);
  const handleTopupSubscriptionTabChange = (tab) => {
    setTopupSubscriptionTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url);
    }
  };
  const personalHasDiscount = (id) => {
    if (!pricing.coupon.applied || !pricing.prices.originalPersonal) return false;
    const current = pricing.prices.personal?.[id];
    const original = pricing.prices.originalPersonal?.[id];
    if (typeof current !== "number" || typeof original !== "number") return false;
    return current < original;
  };
  const enterpriseHasDiscount = (id) => {
    if (!pricing.coupon.applied || !pricing.prices.originalEnterprise) return false;
    const current = pricing.prices.enterprise?.[id];
    const original = pricing.prices.originalEnterprise?.[id];
    if (typeof current !== "number" || typeof original !== "number") return false;
    return current < original;
  };
  const getPersonalOriginalPrice = (id) => {
    return pricing.prices.originalPersonal ? pricing.prices.originalPersonal[id] : void 0;
  };
  const getEnterpriseOriginalPrice = (id) => {
    return pricing.prices.originalEnterprise ? pricing.prices.originalEnterprise[id] : void 0;
  };
  const getPlanKey = (planOrId) => {
    if (!planOrId) return "";
    if (typeof planOrId === "string") return planOrId;
    return planOrId.plan_key || planOrId.id || "";
  };
  const getQty = (planOrId) => {
    const key = getPlanKey(planOrId);
    if (!key) return 1;
    return pricing.ui.selectedQty[key] || 1;
  };
  const setQty = (planOrId, q) => {
    const key = getPlanKey(planOrId);
    if (!key) return;
    pricing.ui.setSelectedQty((prev) => ({ ...prev, [key]: q }));
  };
  const supportsMultiCycle = (planOrId) => {
    const id = typeof planOrId === "string" ? planOrId : planOrId?.id;
    if (!id) return false;
    return id !== "claude_code_oneday" && id !== "claude_code_coin_pack" && id !== "sora2" && id !== "enterprise_coin_pack";
  };
  const handlePlanSelect = async (plan) => {
    if (!isAuthenticated()) {
      try {
        const ret = window.location.pathname + window.location.search + window.location.hash;
        localStorage.setItem("login_return", ret || "/pricing");
      } catch (e) {
      }
      window.location.href = "/login";
      return;
    }
    if (plan.id?.startsWith("openclaw_")) {
      const orderPlan = {
        id: "subscription_openclaw",
        price: plan.totalPrice,
        priceCNY: plan.totalPriceCNY,
        name: plan.name,
        days: 30,
        dailyPrice: plan.totalPrice / 30,
        dailyPriceCNY: plan.totalPriceCNY / 30
      };
      await pricing.createOrder(orderPlan);
      return;
    }
    if (plan.id === "pool_promo") {
      await pricing.createOrder({ ...plan, customPrice: "8888" });
      return;
    }
    if (plan.id === "flexible_topup" || plan.id === "custom_topup" || plan.id?.startsWith("tier_")) {
      const orderPlan = {
        id: "flexible_topup",
        price: plan.price,
        name: plan.name || `\u5145\u503C $${plan.price}`,
        bonus: plan.bonus || 0
      };
      await pricing.createOrder(orderPlan);
      return;
    }
    if (plan.id === "sora2") {
      await pricing.createOrder(plan);
      return;
    }
    if (plan?.cycle) {
      const cycleToQty = { monthly: 1, quarterly: 3, yearly: 12 };
      const qty = cycleToQty[plan.cycle] || 1;
      await pricing.createOrder(plan, qty);
      return;
    }
    if (supportsMultiCycle(plan)) {
      pricing.openPurchaseModal(plan);
      return;
    }
    await pricing.createOrder(plan);
  };
  const handlePermanentBundleContact = () => {
    const mailto = `mailto:${permanentContactEmail}?subject=${encodeURIComponent("Token\u5957\u9910\u5B9A\u5236")}`;
    if (typeof window !== "undefined") {
      try {
        window.location.href = mailto;
      } catch (e) {
        console.error("\u65E0\u6CD5\u6253\u5F00\u90AE\u4EF6\u5BA2\u6237\u7AEF", e);
      }
    }
  };
  const handlePermanentBundlePurchase = async (bundle) => {
    if (!isAuthenticated()) {
      if (DEV_BYPASS) {
        y.info("\u5F00\u53D1\u9884\u89C8\uFF1A\u5DF2\u8DF3\u8FC7\u767B\u5F55\uFF0C\u4E0D\u6267\u884C\u4E0B\u5355\u6D41\u7A0B");
        return;
      }
      try {
        const ret = window.location.pathname + window.location.search + window.location.hash;
        localStorage.setItem("login_return", ret || "/pricing");
      } catch (e) {
      }
      window.location.href = "/login";
      return;
    }
    await pricing.createOrder({
      id: "permanent_credits",
      price: bundle.amount
    });
  };
  const handleCheckPayment = async () => {
    try {
      y.loading("\u6B63\u5728\u68C0\u67E5\u652F\u4ED8\u72B6\u6001...", { id: "checking-payment" });
      const response = await fetch(`/api/order/query?order_id=${pricing.payment.orderNo}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const result = await response.json().catch(() => ({}));
      const status = result?.data?.status;
      const statusDesc = result?.data?.status_desc || status;
      if (!response.ok || !(result.success && result.data) || !status) {
        y.dismiss("checking-payment");
        y.info("\u6B63\u5728\u8DF3\u8F6C\u5230\u63A7\u5236\u53F0\u67E5\u770B\u8BA2\u5355\u72B6\u6001...", { duration: 2e3 });
        pricing.payment.close();
        setTimeout(() => {
          window.location.href = `/console/wallet`;
        }, 2e3);
        return;
      }
      if (status === "success" || status === "payed") {
        y.dismiss("checking-payment");
        y.success("\u2713 \u652F\u4ED8\u6210\u529F\uFF01\u6B63\u5728\u8DF3\u8F6C...", { duration: 2e3 });
        pricing.payment.close();
        pricing.fetchUserBalance();
        setTimeout(() => {
          window.location.href = `/console/wallet`;
        }, 2e3);
        return;
      }
      if (status === "new") {
        y.dismiss("checking-payment");
        y.warning("\u8BA2\u5355\u5C1A\u672A\u652F\u4ED8\uFF0C\u8BF7\u7EE7\u7EED\u626B\u7801\u652F\u4ED8", { duration: 3e3 });
        return;
      }
      if (status === "expire" || status === "not_exist") {
        y.dismiss("checking-payment");
        y.error("\u8BA2\u5355\u5DF2\u8FC7\u671F\u6216\u4E0D\u5B58\u5728\uFF0C\u8BF7\u91CD\u65B0\u4E0B\u5355", { duration: 3e3 });
        pricing.payment.close();
        return;
      }
      y.dismiss("checking-payment");
      y.info(`\u8BA2\u5355\u72B6\u6001: ${statusDesc}`, { duration: 3e3 });
      return;
    } catch (error) {
      console.error("\u68C0\u67E5\u652F\u4ED8\u72B6\u6001\u5931\u8D25:", error);
      y.dismiss("checking-payment");
      y.error("\u68C0\u67E5\u652F\u4ED8\u72B6\u6001\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", { duration: 3e3 });
    }
  };
  const isQuotaMode = true;
  const commonSectionProps = {
    hiddenPlans: pricing.plans.hidden,
    personalPrices: pricing.prices.personal,
    personalCredits: pricing.credits.personal,
    getPersonalOriginalPrice,
    personalHasDiscount,
    loading: pricing.payment.loading,
    selectedPlan: pricing.payment.selectedPlan,
    onPlanSelect: handlePlanSelect,
    isAuthenticated,
    showCouponInput: pricing.coupon.showInput,
    appliedCoupon: pricing.coupon.applied,
    getQty,
    setQty,
    formatPrice: formatPrice2,
    calcBulkNumbers,
    creditDisplay: pricing.creditDisplay
    // 新增：积分展示配置
  };
  return /* @__PURE__ */ import_react27.default.createElement(
    "div",
    {
      className: `pricing-terminal-shell ${scanlineEnabled ? "" : "pricing-no-scanlines"} ${!scanlineEnabled && softTextureEnabled ? "pricing-soft-texture" : ""} ${!scanlineEnabled && !softTextureEnabled ? "pricing-flat" : ""} min-h-screen pt-24 pb-8`,
      "data-texture-mode": textureMode
    },
    /* @__PURE__ */ import_react27.default.createElement("section", { id: "pricing", style: { scrollMarginTop: 100 } }, /* @__PURE__ */ import_react27.default.createElement("div", { className: "relative z-10 max-w-[1440px] mx-auto px-site-margin" }, /* @__PURE__ */ import_react27.default.createElement(
      PricingHeader,
      {
        isAuthed: pricing.isAuthed(),
        currentBalance: pricing.balance.current,
        balanceLoading: pricing.balance.loading,
        useBalance: pricing.balance.enabled,
        setUseBalance: pricing.balance.setEnabled,
        appliedCoupon: pricing.coupon.applied,
        clearCoupon: pricing.coupon.clear,
        showCouponInput: pricing.coupon.showInput,
        couponCode: pricing.coupon.code,
        setCouponCode: pricing.coupon.setCode,
        couponLoading: pricing.coupon.loading,
        applyCoupon: pricing.coupon.apply,
        formatPrice: formatPrice2,
        topRightContent: /* @__PURE__ */ import_react27.default.createElement(import_react27.default.Fragment, null, /* @__PURE__ */ import_react27.default.createElement(
          PricingSectionTabs,
          {
            sections: [
              { id: "pricing", label: t2.sectionTabs?.pricing || "\u4EF7\u683C" },
              { id: "models", label: t2.sectionTabs?.models || "\u6A21\u578B" }
            ],
            sticky: false,
            align: "end",
            scrollOffset: 100
          }
        ), isQuotaMode ? /* @__PURE__ */ import_react27.default.createElement(
          TopupSubscriptionTabs,
          {
            activeTab: topupSubscriptionTab,
            onChange: handleTopupSubscriptionTabChange,
            align: "right",
            className: "mb-0"
          }
        ) : null)
      }
    ), /* @__PURE__ */ import_react27.default.createElement(
      ErrorAlert,
      {
        error: pricing.error,
        onEnterpriseClick: () => {
          const el = document.getElementById("plan-enterprise_growth") || document.getElementById("plan-enterprise_scale");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        onPersonalClick: () => {
          const el = document.getElementById("plan-claude_code_normal") || document.getElementById("plan-claude_code_medium") || document.getElementById("plan-claude_code_large");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    ), !isQuotaMode && pricing.coupon.showInput && /* @__PURE__ */ import_react27.default.createElement(
      CouponBanner,
      {
        appliedCoupon: pricing.coupon.applied,
        originalPlans: pricing.plans.personal
      }
    ), isQuotaMode ? /* @__PURE__ */ import_react27.default.createElement("div", { className: "pb-8" }, topupSubscriptionTab === "topup" ? /* @__PURE__ */ import_react27.default.createElement(import_react27.default.Fragment, null, /* @__PURE__ */ import_react27.default.createElement(BundleGiftClaimCard, null), /* @__PURE__ */ import_react27.default.createElement(
      TopupTiersGrid,
      {
        loading: pricing.payment.loading,
        selectedPlan: pricing.payment.selectedPlan,
        onPlanSelect: handlePlanSelect,
        promotionConfig: pricing.promotionConfig,
        poolPromoEnabled: pricing.poolPromoEnabled
      }
    ), /* @__PURE__ */ import_react27.default.createElement(TopupComparisonTable, null)) : topupSubscriptionTab === "subscription" ? /* @__PURE__ */ import_react27.default.createElement(
      SubscriptionPlansSection2,
      {
        onPlanSelect: handlePlanSelect
      }
    ) : /* @__PURE__ */ import_react27.default.createElement(
      OpenclawSubscriptionSection,
      {
        onPlanSelect: handlePlanSelect
      }
    )) : /* @__PURE__ */ import_react27.default.createElement(import_react27.default.Fragment, null, /* @__PURE__ */ import_react27.default.createElement(
      PlanTabs,
      {
        activeTab: pricing.ui.activePlanTab,
        onChange: pricing.ui.setActivePlanTab
      }
    ), /* @__PURE__ */ import_react27.default.createElement("div", { className: "mb-12" }, pricing.ui.activePlanTab === "experience" && /* @__PURE__ */ import_react27.default.createElement(
      ExperiencePlanSection,
      {
        ...commonSectionProps,
        sora2Amount: pricing.ui.sora2Amount,
        setSora2Amount: pricing.ui.setSora2Amount,
        minTopup: pricing.prices.minTopup,
        coinPackType: pricing.ui.coinPackType,
        setCoinPackType: pricing.ui.setCoinPackType,
        coinPackChecking: pricing.eligibility.coinPackChecking,
        coinPackEligible: pricing.eligibility.coinPack,
        enterpriseCoinPackChecking: pricing.eligibility.enterpriseCoinPackChecking,
        enterpriseCoinPackEligible: pricing.eligibility.enterpriseCoinPack,
        enterprisePlans: pricing.plans.enterprise,
        setActivePlanTab: pricing.ui.setActivePlanTab
      }
    ), pricing.ui.activePlanTab === "personal" && /* @__PURE__ */ import_react27.default.createElement(
      PersonalPlanSection,
      {
        ...commonSectionProps,
        selectedPersonalPlan: pricing.ui.selectedPersonalPlan,
        setSelectedPersonalPlan: pricing.ui.setSelectedPersonalPlan,
        DISCOUNT_CONFIG
      }
    ), pricing.ui.activePlanTab === "enterprise" && /* @__PURE__ */ import_react27.default.createElement(
      EnterprisePlanSection,
      {
        enterprisePlans: pricing.plans.enterprise,
        enterprisePrices: pricing.prices.enterprise,
        selectedEnterprisePlan: pricing.ui.selectedEnterprisePlan,
        setSelectedEnterprisePlan: pricing.ui.setSelectedEnterprisePlan,
        getQty,
        setQty,
        onPlanSelect: handlePlanSelect,
        loading: pricing.payment.loading,
        selectedPlan: pricing.payment.selectedPlan,
        enterpriseHasDiscount,
        getEnterpriseOriginalPrice,
        appliedCoupon: pricing.coupon.applied,
        calcBulkNumbers,
        formatPrice: formatPrice2,
        DISCOUNT_CONFIG
      }
    ), pricing.ui.activePlanTab === "flexible" && /* @__PURE__ */ import_react27.default.createElement(
      FlexiblePlanSection,
      {
        ...commonSectionProps,
        sora2Amount: pricing.ui.sora2Amount,
        setSora2Amount: pricing.ui.setSora2Amount,
        minTopup: pricing.prices.minTopup,
        coinPackType: pricing.ui.coinPackType,
        setCoinPackType: pricing.ui.setCoinPackType,
        coinPackChecking: pricing.eligibility.coinPackChecking,
        coinPackEligible: pricing.eligibility.coinPack,
        enterpriseCoinPackChecking: pricing.eligibility.enterpriseCoinPackChecking,
        enterpriseCoinPackEligible: pricing.eligibility.enterpriseCoinPack,
        enterprisePlans: pricing.plans.enterprise,
        setActivePlanTab: pricing.ui.setActivePlanTab,
        selectedPermanentBundle: pricing.ui.selectedPermanentBundle,
        onBundleSelect: pricing.ui.setSelectedPermanentBundle,
        permanentCreditBundles: pricing.permanentCreditBundles,
        onPermanentContact: handlePermanentBundleContact,
        onPermanentPurchase: handlePermanentBundlePurchase
      }
    ))), /* @__PURE__ */ import_react27.default.createElement(
      LegalConsentNotice,
      {
        context: "purchase",
        className: "mt-2 mb-6 text-xs text-center text-[var(--term-text-soft)]",
        linkClassName: "text-[var(--term-primary)] underline hover:opacity-80"
      }
    ), /* @__PURE__ */ import_react27.default.createElement(
      PurchaseConfirmModal,
      {
        show: pricing.ui.showPurchaseModal && !!pricing.ui.purchasePlan,
        plan: pricing.ui.purchasePlan,
        quantity: pricing.ui.purchaseQty,
        setQuantity: pricing.ui.setPurchaseQty,
        appliedCoupon: pricing.coupon.applied,
        loading: pricing.payment.loading,
        onClose: () => pricing.ui.setShowPurchaseModal(false),
        onConfirm: async () => {
          pricing.ui.setShowPurchaseModal(false);
          await pricing.createOrder(pricing.ui.purchasePlan, pricing.ui.purchaseQty);
        },
        calcBulkNumbers,
        formatPrice: formatPrice2
      }
    ), /* @__PURE__ */ import_react27.default.createElement(
      QRCodeModal,
      {
        show: pricing.payment.showQrCode,
        qrCodeImage: pricing.payment.qrCodeImage,
        orderNo: pricing.payment.orderNo,
        timeLeft: pricing.payment.timeLeft,
        isPolling: pricing.payment.isPolling,
        countdownSeconds: pricing.payment.countdownSeconds,
        selectedPlan: pricing.payment.selectedPlan,
        sora2Amount: pricing.ui.sora2Amount,
        formatPrice: formatPrice2,
        formatTime,
        onClose: pricing.payment.close,
        onCheckPayment: handleCheckPayment
      }
    ))),
    /* @__PURE__ */ import_react27.default.createElement(
      "section",
      {
        id: "models",
        style: { scrollMarginTop: 100 },
        className: "relative z-10 max-w-[1440px] mx-auto px-site-margin pt-12 pb-8"
      },
      /* @__PURE__ */ import_react27.default.createElement(ModelPricingTable, null),
      /* @__PURE__ */ import_react27.default.createElement(ModelsSection, null)
    ),
    /* @__PURE__ */ import_react27.default.createElement(xo, { theme: "dark" }),
    /* @__PURE__ */ import_react27.default.createElement("style", null, `
					.pricing-no-scanlines::before,
					.pricing-no-scanlines::after {
						display: none !important;
						opacity: 0 !important;
						background: none !important;
						content: none !important;
					}

					.pricing-no-scanlines .pricing-terminal-header,
					.pricing-no-scanlines .term-window,
					.pricing-no-scanlines .term-panel {
						background-image: none !important;
					}
				`)
  );
}

// ../tmp/app-frontend/app/Pricing.jsx
renderPage({ Component: Pricing });
