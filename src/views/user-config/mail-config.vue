<template>
  <div class="mail-config-page">
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <span class="page-title">提醒邮箱配置</span>
      </template>

      <el-alert
        title="配置说明"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 24px"
      >
        <template #default>
          <p class="alert-line">当自选股现价 ≥ 预期卖出价时，系统会向下方「收件邮箱」发送卖出提醒邮件。</p>
          <p class="alert-line">配置为空或「是否启用」关闭时，系统不会发送任何邮件。</p>
          <p class="alert-line">「SMTP 密码 / 授权码」留空表示不修改已保存的密码；首次配置必须填写。</p>
        </template>
      </el-alert>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="220px" style="max-width: 780px">
        <el-form-item label="SMTP 服务器地址" prop="mailHost">
          <el-input v-model="form.mailHost" placeholder="例如 smtp.qq.com" clearable/>
        </el-form-item>
        <el-form-item label="SMTP 端口" prop="mailPort">
          <el-input-number v-model="form.mailPort" :min="1" :max="65535" :precision="0" style="width: 200px"/>
          <span class="form-tip">默认 587（STARTTLS）</span>
        </el-form-item>
        <el-form-item label="发件邮箱 / 登录账号" prop="mailUsername">
          <el-input v-model="form.mailUsername" placeholder="例如 123456@qq.com" clearable/>
        </el-form-item>
        <el-form-item label="SMTP 密码 / 授权码" prop="mailPassword">
          <el-input v-model="form.mailPassword" type="password" show-password clearable
                    placeholder="留空表示不修改已保存的密码"/>
        </el-form-item>
        <el-form-item label="收件邮箱" prop="notifyEmail">
          <el-input v-model="form.notifyEmail" placeholder="卖出提醒发送到此邮箱" clearable/>
        </el-form-item>
        <el-form-item label="是否启用" prop="enabled">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0"
                     active-text="启用" inactive-text="停用"/>
        </el-form-item>

        <el-divider content-position="left">发送频率限制</el-divider>

        <el-form-item label="每小时最多发送次数" prop="maxSendPerHour">
          <el-input-number v-model="form.maxSendPerHour" :min="1" :precision="0" style="width: 200px"/>
          <span class="form-tip">同一只股票每小时内最多发送几封（默认 1）</span>
        </el-form-item>
        <el-form-item label="每天最多发送次数" prop="maxSendPerDay">
          <el-input-number v-model="form.maxSendPerDay" :min="1" :precision="0" style="width: 200px"/>
          <span class="form-tip">所有股票合计每天最多发送几封（默认 5）</span>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" clearable/>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          <el-button @click="loadConfig">重新读取</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import {getMailConfig, saveMailConfig} from '@/api/modules/api.mail'

const formRef = ref()
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  mailHost: '',
  mailPort: 587,
  mailUsername: '',
  mailPassword: '',
  notifyEmail: '',
  enabled: 1,
  maxSendPerHour: 1,
  maxSendPerDay: 5,
  remark: '',
})

const rules = {
  mailHost: [{required: true, message: '请输入 SMTP 服务器地址', trigger: 'blur'}],
  mailPort: [{required: true, message: '请输入 SMTP 端口', trigger: 'blur'}],
  mailUsername: [{required: true, message: '请输入发件邮箱 / 登录账号', trigger: 'blur'}],
  notifyEmail: [
    {required: true, message: '请输入收件邮箱', trigger: 'blur'},
    {type: 'email', message: '邮箱格式不正确', trigger: 'blur'},
  ],
  maxSendPerHour: [{required: true, message: '请输入每小时上限', trigger: 'blur'}],
  maxSendPerDay: [{required: true, message: '请输入每天上限', trigger: 'blur'}],
}

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await getMailConfig()
    const data = res.data || {}
    form.mailHost = data.mailHost ?? ''
    form.mailPort = data.mailPort ?? 587
    form.mailUsername = data.mailUsername ?? ''
    form.mailPassword = ''
    form.notifyEmail = data.notifyEmail ?? ''
    form.enabled = data.enabled ?? 1
    form.maxSendPerHour = data.maxSendPerHour ?? 1
    form.maxSendPerDay = data.maxSendPerDay ?? 5
    form.remark = data.remark ?? ''
  } catch (e) {
    ElMessage.error('读取配置失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

const handleSave = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    saving.value = true
    try {
      const res = await saveMailConfig({...form})
      if (res.data?.success) {
        ElMessage.success('保存成功')
        await loadConfig()
      } else {
        ElMessage.error(res.data?.message || '保存失败')
      }
    } catch (e) {
      ElMessage.error('保存失败，请检查后端服务')
    } finally {
      saving.value = false
    }
  })
}

onMounted(loadConfig)
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 16px;
  font-weight: 600;
}

.alert-line {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.6;
}

.form-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}
</style>
