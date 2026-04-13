<!--
 @description: 登录
 @author: mfish
 @date: 2023/7/6
-->
<template>
  <section class="login-container">
    <div class="left-panel">
      <div class="left-top">
        <div class="brand-mark">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="white" fill-opacity="0.15" />
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.9" />
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.5" />
          </svg>
        </div>
        <span class="brand-name">{{ shortName }}</span>
      </div>

      <div class="characters-area">
        <AnimatedCharacters
          :is-typing="isTyping"
          :show-password="passwordShow"
          :password-length="password.length"
        />
      </div>

      <div class="left-footer">
        <!-- <a href="https://jq.qq.com/?_wv=1027&k=0A2bxoZX" target="_blank">加入我们</a> -->
        <!-- <a href="#">帮助中心</a> -->
      </div>

      <div class="decor-blur decor-blur-1"></div>
      <div class="decor-blur decor-blur-2"></div>
      <div class="decor-grid"></div>
    </div>

    <div class="right-panel">
      <div class="form-wrapper">
        <div class="mobile-logo">
          <div class="mobile-logo-icon">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="#1E40AF" fill-opacity="0.9" />
              <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="#3B82F6" fill-opacity="0.7" />
            </svg>
          </div>
          <span>{{ title }}</span>
        </div>

        <div class="form-header">
          <h1 class="form-title">帐号登录</h1>
          <!-- <p class="form-subtitle">欢迎使用{{ title }}</p> -->
        </div>

        <form id="login" method="POST" class="login-form">
          <div class="field-label">用户名</div>
          <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control"
              :class="{ 'is-invalid': error.username.show, 'is-valid': isValid }"
              id="inputUsername"
              v-model="username"
              name="username"
              placeholder="用户名"
              @blur="validateUserName"
              @keydown.enter="login"
              @focus="isTyping = true"
              @blur.capture="isTyping = false"
            />
            <label for="inputUsername">用户名</label>
            <div class="invalid-feedback" v-if="error.username.show">
              {{ error.username.msg }}
            </div>
          </div>

          <div class="field-label">密码</div>
          <div class="input-group mb-3">
            <div class="form-floating">
              <input
                :type="passwordType"
                class="form-control"
                :class="{ 'is-invalid': error.password.show, 'is-valid': isValid }"
                id="inputPassword"
                v-model="password"
                name="password"
                placeholder="密码"
                @blur="validatePassword"
                @keydown.enter="login"
              />
              <label for="inputPassword">密码</label>
              <div class="invalid-feedback" v-if="error.password.show">
                {{ error.password.msg }}
              </div>
            </div>
            <span class="btn send-msg" @mouseover="msgOver" @mouseleave="msgLeave" @click="pwdShowChange">
              <svg
                v-if="passwordShow"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                :fill="sendMsgColor"
                class="bi bi-eye"
                viewBox="0 0 16 16"
              >
                <path
                  d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"
                />
                <path
                  d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                :fill="sendMsgColor"
                class="bi bi-eye-slash"
                viewBox="0 0 16 16"
              >
                <path
                  d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"
                />
                <path
                  d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"
                />
                <path
                  d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"
                />
              </svg>
            </span>
          </div>

          <div class="field-label" v-if="captchaOnOff">验证码</div>
          <div class="input-group mb-1" v-if="captchaOnOff">
            <div class="form-floating">
              <input
                type="text"
                class="form-control"
                :class="{ 'is-invalid': error.captcha.show, 'is-valid': isValid }"
                id="inputCaptcha"
                v-model="captchaValue"
                name="captchaValue"
                placeholder="验证码"
                @blur="validateCaptcha"
                @keydown.enter="login"
              />
              <input type="hidden" name="captchaKey" v-model="captchaKey" />
              <label for="inputCaptcha">验证码</label>
              <div class="invalid-feedback" v-if="error.captcha.show">
                {{ error.captcha.msg }}
              </div>
            </div>
            <span><img :src="captchaUrl" @click="captcha" class="captcha-img" alt="验证码" /></span>
          </div>

          <div class="form-check mb-3">
            <!-- <input class="form-check-input" id="rememberMe" type="checkbox" name="rememberMe" v-model="rememberMe" /> -->
            <!-- <label class="form-check-label" for="rememberMe">记住我</label> -->
            <!-- <a style="float: right" href="https://jq.qq.com/?_wv=1027&k=0A2bxoZX" target="_blank">加入我们</a> -->
          </div>

          <div id="errorShow" data-bs-toggle="modal" data-bs-target="#errorModal" style="position: absolute"></div>
          <div class="modal fade" id="errorModal">
            <div class="modal-dialog">
              <div class="alert alert-danger" role="alert">
                {{ errorMsg }}
              </div>
            </div>
          </div>

          <div class="d-grid gap-2 mb-1">
            <button type="button" class="btn btn-primary btn-block" @click="login">登录</button>
          </div>
        </form>

        <!-- <div class="login-divider">
          <hr class="divider" style="flex: 1" />
          <span style="padding: 0 10px 0 10px">其他方式登录</span>
          <hr class="divider" style="flex: 1" />
        </div>

        <div class="other-login">
          <Icon style="cursor: pointer" icon="simple-icons:gitee" color="#bf0c2c" :size="32" @click="giteeLogin" />
          <Icon style="cursor: pointer" icon="simple-icons:github" :size="32" @click="githubLogin" />
        </div> -->
      </div>
    </div>
  </section>
</template>
<script lang="ts" setup>
  import "bootstrap/dist/js/bootstrap.min.js";
  import { computed, onMounted, onUnmounted, reactive, ref, unref } from "vue";
  import { getCaptcha } from "@mfish/core/api";
  import { giteeConfig, githubConfig, oauth2Config } from "@mfish/core/settings/LoginSetting";
  import { useGlobSetting, useI18n, useMessage } from "@mfish/core/hooks";
  import { useUserStore } from "@mfish/stores/modules";
  import { debounce } from "lodash-es";
  import { Icon } from "@mfish/core/components/Icon";
  import AnimatedCharacters from "@/components/general/AnimatedCharacters/Index.vue";

  const username = ref("");
  const password = ref("");
  const captchaValue = ref("");
  const captchaOnOff = ref<boolean>(true);
  const errorMsg = ref("");
  const { title, shortName } = useGlobSetting();
  const showLeft = computed(() => {
    return document.body.clientWidth > 425;
  });
  const passwordShow = ref(false);
  const passwordType = ref("password");
  const sendMsgColor = ref("black");
  const captchaKey = ref("");
  const captchaUrl = ref("");
  const rememberMe = ref(false);
  const isValid = ref(false);
  const isTyping = ref(false);
  const { notification } = useMessage();
  const userStore = useUserStore();
  const { t } = useI18n();
  const error = reactive({
    username: {
      show: false,
      msg: ""
    },
    password: {
      show: false,
      msg: ""
    },
    captcha: {
      show: false,
      msg: ""
    },
    phone: {
      show: false,
      msg: ""
    },
    code: {
      show: false,
      msg: ""
    }
  });
  onMounted(() => {
    const link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", "/resource/bootstrap/bootstrap.min.css");
    link.setAttribute("id", "bootstrap-css");
    document.head.append(link);
    captcha();
  });
  onUnmounted(() => {
    const link = document.querySelector("#bootstrap-css");
    if (link) {
      link.remove();
    }
  });

  function validateUserLogin() {
    return !(!validateUserName() || !validatePassword() || (captchaOnOff.value && !validateCaptcha()));
  }

  function validateUserName() {
    if (!unref(username)) {
      showInputError("username", "请输入用户名");
      return false;
    }
    hideInputError("username");
    return true;
  }

  function validatePassword() {
    if (!password.value) {
      showInputError("password", "请输入密码");
      return false;
    }
    hideInputError("password");
    return true;
  }

  function validateCaptcha() {
    if (!captchaValue.value) {
      showInputError("captcha", "请输入验证码");
      return false;
    }
    hideInputError("captcha");
    return true;
  }

  function showInputError(key, error) {
    setError(key, true, error);
  }

  function setError(key, show, err) {
    error[key].show = show;
    error[key].msg = err;
  }

  function hideInputError(key) {
    setError(key, false, "");
  }

  function pwdShowChange() {
    passwordShow.value = !passwordShow.value;
    passwordType.value = passwordShow.value ? "text" : "password";
  }

  function msgOver() {
    sendMsgColor.value = "#0d6efd";
  }

  function msgLeave() {
    sendMsgColor.value = "black";
  }

  function captcha() {
    getCaptcha().then((res) => {
      captchaUrl.value = `data:image/jpeg;base64,${res.img}`;
      captchaKey.value = res.captchaKey;
      captchaOnOff.value = res.captchaOnOff;
    });
  }

  const login = () => {
    if (validateUserLogin()) {
      isValid.value = true;
      handleLogin();
    }
  };

  const handleLogin = debounce(() => {
    userStore
      .loginRedirect({
        password: password.value,
        username: username.value,
        rememberMe: rememberMe.value,
        client_id: oauth2Config.client_id,
        client_secret: oauth2Config.client_secret,
        grant_type: "password",
        redirect_uri: oauth2Config.redirect_uri,
        captchaValue: captchaValue.value,
        captchaKey: captchaKey.value,
        mode: "modal"
      })
      .then((userInfo) => {
        notification.success({
          message: t("sys.login.loginSuccessTitle"),
          description: `${t("sys.login.loginSuccessDesc")}: ${userInfo?.nickname || userInfo?.account}`,
          duration: 3
        });
      })
      .catch(() => {
        captcha();
      });
  }, 200);

  function giteeLogin() {
    globalThis.location.href = `https://gitee.com/oauth/authorize?client_id=${giteeConfig.client_id}&redirect_uri=${giteeConfig.redirect_uri}&response_type=code`;
  }

  function githubLogin() {
    globalThis.location.href = `https://github.com/login/oauth/authorize?client_id=${githubConfig.client_id}&redirect_uri=${githubConfig.redirect_uri}&response_type=code`;
  }
</script>
<style scoped lang="less">
  html,
  body {
    height: 100%;
  }

  ::-ms-reveal {
    display: none;
  }

  .login-container {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 1024px) {
    .login-container {
      grid-template-columns: 1fr;
    }
  }

  .left-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
    overflow: hidden;
  }

  @media (max-width: 1024px) {
    .left-panel {
      display: none;
    }
  }

  .left-top {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
  }

  .brand-mark {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    backdrop-filter: blur(8px);
  }

  .brand-name {
    color: #ffffff;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .characters-area {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 500px;
  }

  .left-footer {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .left-footer a {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
    text-decoration: none;
    transition: color 0.2s;
    cursor: pointer;
  }

  .left-footer a:hover {
    color: rgba(255, 255, 255, 0.85);
  }

  .decor-blur {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }

  .decor-blur-1 {
    top: 15%;
    right: 10%;
    width: 300px;
    height: 300px;
    background: rgba(59, 130, 246, 0.25);
    filter: blur(80px);
  }

  .decor-blur-2 {
    bottom: 10%;
    left: 5%;
    width: 400px;
    height: 400px;
    background: rgba(30, 64, 175, 0.3);
    filter: blur(100px);
  }

  .decor-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 1;
  }

  .right-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    background: #ffffff;
  }

  .form-wrapper {
    width: 100%;
    max-width: 400px;
  }

  .mobile-logo {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 48px;
  }

  @media (max-width: 1024px) {
    .mobile-logo {
      display: flex;
    }
  }

  .mobile-logo-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .form-title {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0f172a;
    margin: 0 0 10px 0;
    line-height: 1.3;
  }

  .form-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
    line-height: 1.6;
  }

  .login-form :deep(.ant-form-item) {
    margin-bottom: 20px;
  }

  .login-form :deep(.ant-input-affix-wrapper) {
    height: 48px !important;
    background: #fafafa !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 10px !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
  }

  .login-form :deep(.ant-input-affix-wrapper:hover) {
    border-color: #3b82f6 !important;
  }

  .login-form :deep(.ant-input-affix-wrapper:focus),
  .login-form :deep(.ant-input-affix-wrapper-focused) {
    border-color: #1e40af !important;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.08) !important;
    background: #ffffff !important;
  }

  .login-form :deep(.ant-input-affix-wrapper .ant-input) {
    background: transparent !important;
    font-size: 14px !important;
    color: #111827 !important;
  }

  .login-form :deep(.ant-input-affix-wrapper .ant-input::placeholder) {
    color: #c0c4cc !important;
  }

  .login-form :deep(.ant-form-item-explain-error) {
    font-size: 13px !important;
    margin-top: 4px !important;
  }

  .field-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
    letter-spacing: 0.2px;
  }

  .prefix-icon {
    color: #b0b7c3;
    font-size: 15px;
  }

  .eye-toggle {
    color: #6b7280;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }

  .eye-toggle:hover {
    color: #374151;
  }

  .error-box {
    padding: 10px 14px;
    font-size: 13px;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .submit-btn {
    height: 48px !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    border-radius: 10px !important;
    background: #1e40af !important;
    border-color: #1e40af !important;
    letter-spacing: 1px;
    transition: background 0.2s, opacity 0.2s !important;
    cursor: pointer;
  }

  .submit-btn:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
    opacity: 1 !important;
  }

  .submit-btn:active {
    opacity: 0.85 !important;
  }

  .login-form .form-control {
    border-width: 1px;
    border-radius: 6px !important;
    background-image: none;
    height: 48px;
    background: #fafafa;
    border: 1px solid #e5e7eb;
  }

  .login-form .form-control:focus {
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.08);
    background: #ffffff;
  }

  .login-form .form-floating label {
    color: #6b7280;
  }

  .login-form .send-msg {
    position: absolute;
    top: 18px;
    right: 10px;
    z-index: 10;
    border: none;
    background: transparent;
  }

  .login-form .captcha-img {
    position: absolute;
    top: 1px;
    right: 0;
    width: 149px;
    z-index: 10;
    border-radius: 6px;
    cursor: pointer;
  }

  .login-form .btn.btn-block {
    padding: 10px;
    height: 48px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 10px;
    background: #1e40af;
    border-color: #1e40af;
    color: white;
  }

  .login-form .btn.btn-block:hover {
    background: #1d4ed8;
    border-color: #1d4ed8;
    opacity: 1;
  }

  .login-form .btn.btn-block:active {
    opacity: 0.85;
  }

  .login-divider {
    display: flex;
    align-items: center;
    color: #6c6c6c;
    margin: 20px 0 0;
  }

  .other-login {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
  }

  @media screen and (max-width: 540px) {
    .left-top {
      margin: 20px 0 0 20px;
    }
  }

  @media screen and (max-width: 425px) {
    .form-wrapper {
      width: 100%;
      margin: 0 auto;
    }

    .left-top {
      margin: 20px 0 0 20px;
    }

    .login-form .btn.btn-block {
      width: 100px;
    }
  }

  @media screen and (max-width: 375px) {
    .login-form .btn.btn-block {
      width: 90px;
    }
  }

  @media screen and (max-width: 320px) {
    .login-form .btn.btn-block {
      width: 80px;
      font-size: 12px;
    }
  }
</style>