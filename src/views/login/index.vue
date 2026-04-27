<template>
  <section class="login-box">
    <div class="login-card">
      <div class="login-header">
        <h1>A股数据平台</h1>
        <p>登录您的账户</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User"
                    @keyup.enter="handleLogin"/>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock"
                    show-password @keyup.enter="handleLogin"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </section>
</template>

<script setup>
import {useAuthStore} from '@/stores/Auth'

const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = reactive({
  username: [{required: true, message: '请输入用户名', trigger: 'blur'}],
  password: [{required: true, message: '请输入密码', trigger: 'blur'}],
})

const handleLogin = () => {
  formRef.value.validate(valid => {
    if (!valid) return
    loading.value = true
    authStore.login(form).then(res => {
      ElMessage.success(`登录成功，欢迎: ${res.nickname}`)
    }).catch(err => {
      ElMessage.error(err.message || '登录失败')
    }).finally(() => {
      loading.value = false
    })
  })
}
</script>

<style lang="scss" scoped>
.login-box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .login-card {
    width: 420px;
    padding: 40px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

    .login-header {
      text-align: center;
      margin-bottom: 30px;

      h1 {
        font-size: 28px;
        color: #303133;
        margin-bottom: 8px;
      }

      p {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}
</style>
