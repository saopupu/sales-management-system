/* =========================
   ユーザー設定
========================= */

const USER_SETTINGS = {
  "yoshida@ysr-rs.co.jp": {
    name: "吉田",
    role: "admin"
  },

  "yabe@ysr-rs.co.jp": {
    name: "矢部",
    role: "admin"
  },

  "hayasaka@ysr-rs.co.jp": {
    name: "早坂",
    role: "viewer"
  },

  "yoneyama@ysr-rs.co.jp": {
    name: "米山",
    role: "viewer"
  }
};


/* =========================
   画面要素
========================= */

const loginScreen =
  document.getElementById(
    "loginScreen"
  );

const appScreen =
  document.getElementById(
    "appScreen"
  );

const loginForm =
  document.getElementById(
    "loginForm"
  );

const loginEmailInput =
  document.getElementById(
    "loginEmail"
  );

const loginPasswordInput =
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

const logoutButton =
  document.getElementById(
    "logoutButton"
  );

const loginUserName =
  document.getElementById(
    "loginUserName"
  );

const loginUserRole =
  document.getElementById(
    "loginUserRole"
  );


/* =========================
   ログインメッセージ
========================= */

function showLoginMessage(
  message
) {
  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    message;
}


/* =========================
   ユーザー情報取得
========================= */

function getUserSetting(
  email
) {
  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  return (
    USER_SETTINGS[
      normalizedEmail
    ] || null
  );
}


/* =========================
   権限反映
========================= */

function applyUserPermission(
  user
) {
  const setting =
    getUserSetting(
      user.email
    );

  if (!setting) {
    return false;
  }

  if (loginUserName) {
    loginUserName.textContent =
      setting.name;
  }

  if (
    setting.role === "admin"
  ) {
    if (loginUserRole) {
      loginUserRole.textContent =
        "管理者";
    }

    document.body
      .classList
      .remove(
        "viewer-mode"
      );
  } else {
    if (loginUserRole) {
      loginUserRole.textContent =
        "閲覧";
    }

    document.body
      .classList
      .add(
        "viewer-mode"
      );
  }

  return true;
}


/* =========================
   ログイン画面表示
========================= */

function showLoginScreen() {
  if (loginScreen) {
    loginScreen.hidden =
      false;
  }

  if (appScreen) {
    appScreen.hidden =
      true;
  }

  document.body
    .classList
    .remove(
      "viewer-mode"
    );
}


/* =========================
   業務画面表示
========================= */

function showAppScreen() {
  if (loginScreen) {
    loginScreen.hidden =
      true;
  }

  if (appScreen) {
    appScreen.hidden =
      false;
  }
}


/* =========================
   ログイン状態確認
========================= */

async function checkLogin() {
  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getSession();

    if (error) {
      throw error;
    }

    const session =
      data.session;

    if (!session) {
      showLoginScreen();
      return;
    }

    const allowed =
      applyUserPermission(
        session.user
      );

    if (!allowed) {
      await supabaseClient
        .auth
        .signOut();

      showLoginScreen();

      showLoginMessage(
        "このアカウントには利用権限がありません。"
      );

      return;
    }

    showAppScreen();
  } catch (error) {
    console.error(
      "ログイン状態確認エラー",
      error
    );

    showLoginScreen();

    showLoginMessage(
      "ログイン状態を確認できませんでした。"
    );
  }
}


/* =========================
   ログイン処理
========================= */

async function loginUser(
  email,
  password
) {
  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  if (
    !normalizedEmail ||
    !password
  ) {
    showLoginMessage(
      "メールアドレスとパスワードを入力してください。"
    );

    return;
  }

  if (
    !getUserSetting(
      normalizedEmail
    )
  ) {
    showLoginMessage(
      "このメールアドレスには利用権限がありません。"
    );

    return;
  }

  loginButton.disabled =
    true;

  loginButton.textContent =
    "ログイン中...";

  showLoginMessage("");

  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .signInWithPassword({
          email:
            normalizedEmail,

          password:
            password
        });

    if (error) {
      throw error;
    }

    const allowed =
      applyUserPermission(
        data.user
      );

    if (!allowed) {
      await supabaseClient
        .auth
        .signOut();

      showLoginMessage(
        "このアカウントには利用権限がありません。"
      );

      return;
    }

    loginForm.reset();

    showAppScreen();

    if (
      typeof loadSalesData ===
      "function"
    ) {
      await loadSalesData();
    }

    if (
      typeof render ===
      "function"
    ) {
      render();
    }
  } catch (error) {
    console.error(
      "ログインエラー",
      error
    );

    showLoginMessage(
      "メールアドレスまたはパスワードが違います。"
    );
  } finally {
    loginButton.disabled =
      false;

    loginButton.textContent =
      "ログイン";
  }
}


/* =========================
   ログアウト処理
========================= */

async function logoutUser() {
  try {
    const {
      error
    } =
      await supabaseClient
        .auth
        .signOut();

    if (error) {
      throw error;
    }

    showLoginMessage("");

    showLoginScreen();
  } catch (error) {
    console.error(
      "ログアウトエラー",
      error
    );

    alert(
      "ログアウトできませんでした。"
    );
  }
}


/* =========================
   イベント
========================= */

if (loginForm) {
  loginForm.addEventListener(
    "submit",
    async function (
      event
    ) {
      event.preventDefault();

      await loginUser(
        loginEmailInput.value,
        loginPasswordInput.value
      );
    }
  );
}

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    logoutUser
  );
}


/* =========================
   ログイン状態監視
========================= */

supabaseClient.auth
  .onAuthStateChange(
    function (
      event,
      session
    ) {
      if (
        event === "SIGNED_OUT"
      ) {
        showLoginScreen();
        return;
      }

      if (
        session &&
        session.user
      ) {
        const allowed =
          applyUserPermission(
            session.user
          );

        if (allowed) {
          showAppScreen();
        }
      }
    }
  );


/* =========================
   初期確認
========================= */

checkLogin();