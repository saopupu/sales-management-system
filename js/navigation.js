/* =========================
   画面切り替え機能
========================= */

const SYSTEM_VIEW_SECTIONS = {
  home: [
    "alarmCard",
    "bossDashboardSection",
    "paymentDashboardSection",
    "statusDashboardSection"
  ],

  form: [
    "salesFormSection"
  ],

  list: [
    "salesListSection"
  ],

  analysis: [
    "staffAnalysisSection",
    "monthlyPerformanceSection"
  ]
};


/* =========================
   すべての画面対象を取得
========================= */

function getAllSystemViewIds() {
  return [
    ...new Set(
      Object.values(
        SYSTEM_VIEW_SECTIONS
      ).flat()
    )
  ];
}


/* =========================
   対象画面を表示
========================= */

function showSystemView(
  viewName
) {
  const selectedView =
    SYSTEM_VIEW_SECTIONS[
      viewName
    ];

  if (!selectedView) {
    return;
  }

  /*
    すべての画面を一度非表示
  */

  getAllSystemViewIds()
    .forEach(
      function (sectionId) {
        const section =
          document.getElementById(
            sectionId
          );

        if (section) {
          section.classList.add(
            "system-view-hidden"
          );
        }
      }
    );

  /*
    選択した画面だけ表示
  */

  selectedView.forEach(
    function (sectionId) {
      const section =
        document.getElementById(
          sectionId
        );

      if (section) {
        section.classList.remove(
          "system-view-hidden"
        );
      }
    }
  );

  /*
    メニューの選択状態
  */

  document
    .querySelectorAll(
      ".sidebar-link[data-view]"
    )
    .forEach(
      function (button) {
        button.classList.toggle(
          "active",
          button.dataset.view ===
            viewName
        );
      }
    );

  /*
    ページ上部へ移動
  */

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  /*
    最後に開いた画面を保存
  */

  try {
    sessionStorage.setItem(
      "himenaviCurrentView",
      viewName
    );
  } catch (error) {
    console.warn(
      "表示画面を保存できませんでした。",
      error
    );
  }
}


/* =========================
   メニュークリック
========================= */

function initializeSystemNavigation() {
  const menuButtons =
    document.querySelectorAll(
      ".sidebar-link[data-view]"
    );

  menuButtons.forEach(
    function (button) {
      button.addEventListener(
        "click",
        function () {
          const viewName =
            button.dataset.view;

          /*
            閲覧ユーザーが
            入力画面を開かないようにする
          */

          if (
            viewName === "form" &&
            typeof isAdminUser ===
              "function" &&
            !isAdminUser()
          ) {
            return;
          }

          showSystemView(
            viewName
          );
        }
      );
    }
  );

  let initialView =
    "home";

  try {
    const savedView =
      sessionStorage.getItem(
        "himenaviCurrentView"
      );

    if (
      savedView &&
      SYSTEM_VIEW_SECTIONS[
        savedView
      ]
    ) {
      initialView =
        savedView;
    }
  } catch (error) {
    console.warn(
      "保存画面を取得できませんでした。",
      error
    );
  }

  /*
    閲覧ユーザーが前回
    入力画面を開いていた場合
  */

  if (
    initialView === "form" &&
    typeof isAdminUser ===
      "function" &&
    !isAdminUser()
  ) {
    initialView = "home";
  }

  showSystemView(
    initialView
  );
}


/* =========================
   認証後に再調整
========================= */

function refreshSystemNavigation() {
  let currentView =
    "home";

  const activeButton =
    document.querySelector(
      ".sidebar-link[data-view].active"
    );

  if (activeButton) {
    currentView =
      activeButton.dataset.view ||
      "home";
  }

  if (
    currentView === "form" &&
    typeof isAdminUser ===
      "function" &&
    !isAdminUser()
  ) {
    currentView = "home";
  }

  showSystemView(
    currentView
  );
}


/* =========================
   開始
========================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeSystemNavigation
);