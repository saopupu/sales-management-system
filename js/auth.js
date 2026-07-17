/* =========================
   ログインユーザー設定
========================= */

const USER_SETTINGS = {
  "yoshida@ysr-rs.co.jp": {
    name: "吉田",
    role: "admin",
    roleLabel: "管理者"
  },

  "yabe@ysr-rs.co.jp": {
    name: "矢部",
    role: "admin",
    roleLabel: "管理者"
  },

  "hayasaka@ysr-rs.co.jp": {
    name: "早坂",
    role: "viewer",
    roleLabel: "閲覧"
  },

  "yoneyama@ysr-rs.co.jp": {
    name: "米山",
    role: "viewer",
    roleLabel: "閲覧"
  }
};

let currentLoginUser = null;


/* =========================
   ユーザー情報を取得
========================= */

function getUserSetting(
  email
) {
  const normalizedEmail =
    String(
      email || ""
    )
      .trim()
      .toLowerCase();

  return (
    USER_SETTINGS[
      normalizedEmail
    ] || null
  );
}


/* =========================
   管理者判定
========================= */

function isAdminUser() {
  return Boolean(
    currentLoginUser &&
    currentLoginUser.role ===
      "admin"
  );
}


/* =========================
   ログイン画面を表示
========================= */

function showLoginScreen() {
  const loginScreen =
    document.getElementById(
      "loginScreen"
    );

  const appScreen =
    document.getElementById(
      "appScreen"
    );

  if (loginScreen) {
    loginScreen.hidden = false;
  }

  if (appScreen) {
    appScreen.hidden = true;
  }

  currentLoginUser = null;
}


/* =========================
   業務画面を表示
========================= */

function showAppScreen(
  user
) {
  if (!user) {
    showLoginScreen();
    return;
  }

  const setting =
    getUserSetting(
      user.email
    );

  if (!setting) {
    alert(
      "このメールアドレスには利用権限が設定されていません。"
    );

    supabaseClient.auth
      .signOut();

    showLoginScreen();

    return;
  }

  currentLoginUser = {
    id:
      user.id,

    email:
      user.email,

    ...setting
  };

  const loginScreen =
    document.getElementById(
      "loginScreen"
    );

  const appScreen =
    document.getElementById(
      "appScreen"
    );

  if (loginScreen) {
    loginScreen.hidden = true;
  }

  if (appScreen) {
    appScreen.hidden = false;
  }

  const userName =
    document.getElementById(
      "loginUserName"
    );

  const userRole =
    document.getElementById(
      "loginUserRole"
    );

  if (userName) {
    userName.textContent =
      currentLoginUser.name +
      "さん";
  }

  if (userRole) {
    userRole.textContent =
      currentLoginUser.roleLabel;
  }

  /*
    権限を画面へ反映
  */

  applyUserPermissions();

  /*
    画面切り替えを再調整
  */

  if (
    typeof refreshSystemNavigation ===
    "function"
  ) {
    refreshSystemNavigation();
  }

  /*
    今日のホームを再表示
  */

  if (
    typeof refreshAlarm ===
    "function"
  ) {
    refreshAlarm();
  } else if (
    typeof renderAlarm ===
    "function"
  ) {
    renderAlarm();
  }
}


/* =========================
   権限を画面へ反映
========================= */

function applyUserPermissions() {
  const adminOnlyElements =
    document.querySelectorAll(
      ".admin-only"
    );

  adminOnlyElements.forEach(
    function (element) {
      element.hidden =
        !isAdminUser();
    }
  );

  document.body.classList.toggle(
    "viewer-mode",
    !isAdminUser()
  );
}


/* =========================
   ログイン処理
========================= */

async function handleLogin(
  event
) {
  event.preventDefault();

  const emailInput =
    document.getElementById(
      "loginEmail"
    );

  const passwordInput =
    document.getElementById(
      "loginPassword"
    );

  const loginButton =
    document.getElementById(
      "loginButton"
    );

  const loginMessage =
    document.getElementById(
      "loginMessage"
    );

  if (
    !emailInput ||
    !passwordInput ||
    !loginButton ||
    !loginMessage
  ) {
    console.error(
      "ログイン画面の部品が見つかりません。"
    );

    return;
  }

  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  const password =
    passwordInput.value;

  if (
    !getUserSetting(
      email
    )
  ) {
    loginMessage.textContent =
      "登録されていないメールアドレスです。";

    return;
  }

  loginButton.disabled = true;

  loginButton.textContent =
    "ログイン中...";

  loginMessage.textContent = "";

  try {
    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({
          email:
            email,

          password:
            password
        });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error(
        "ログインユーザーを取得できませんでした。"
      );
    }

    showAppScreen(
      data.user
    );

    passwordInput.value = "";

  } catch (error) {
    console.error(
      "ログインエラー",
      error
    );

    loginMessage.textContent =
      "メールアドレスまたはパスワードが違います。";

  } finally {
    loginButton.disabled = false;

    loginButton.textContent =
      "ログイン";
  }
}


/* =========================
   ログアウト処理
========================= */

async function handleLogout() {
  const confirmed =
    confirm(
      "ログアウトしますか？"
    );

  if (!confirmed) {
    return;
  }

  const {
    error
  } =
    await supabaseClient.auth
      .signOut();

  if (error) {
    console.error(
      "ログアウトエラー",
      error
    );

    alert(
      "ログアウトに失敗しました。"
    );

    return;
  }

  showLoginScreen();
}


/* =========================
   ログイン状態を確認
========================= */

async function initializeAuth() {
  const loginForm =
    document.getElementById(
      "loginForm"
    );

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );

  if (loginForm) {
    loginForm.addEventListener(
      "submit",
      handleLogin
    );
  }

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      handleLogout
    );
  }

  const {
    data,
    error
  } =
    await supabaseClient.auth
      .getSession();

  if (error) {
    console.error(
      "ログイン状態確認エラー",
      error
    );

    showLoginScreen();

    return;
  }

  const user =
    data.session?.user;

  if (user) {
    showAppScreen(
      user
    );
  } else {
    showLoginScreen();
  }

  /*
    ログイン状態の変化を監視
  */

  supabaseClient.auth
    .onAuthStateChange(
      function (
        event,
        session
      ) {
        if (
          event ===
            "SIGNED_IN" &&
          session?.user
        ) {
          showAppScreen(
            session.user
          );
        }

        if (
          event ===
          "SIGNED_OUT"
        ) {
          showLoginScreen();
        }
      }
    );
}


/* =========================
   認証機能を開始
========================= */

initializeAuth();