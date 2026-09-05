<template>
  <div class="card">
    <div class="flex items-start justify-between border-b border-divider px-6 py-4">
      <div>
        <h2 class="text-lg font-medium text-content">
          {{ t('profile.passkey.title') }}
        </h2>
        <p class="mt-1 text-sm text-content-2">
          {{ t('profile.passkey.description') }}
        </p>
      </div>
      <button
        v-if="enabled && supported && !showAddForm"
        type="button"
        class="btn btn-primary"
        :disabled="busy"
        @click="showAddForm = true"
      >
        {{ t('profile.passkey.add') }}
      </button>
    </div>

    <div class="px-6 py-6">
      <div v-if="!enabled" class="mb-5 text-sm text-content-2">
        {{ t('profile.passkey.featureDisabled') }}
      </div>
      <div v-if="enabled && !supported" class="mb-5 text-sm text-warning">
        {{ t('profile.passkey.unsupported') }}
      </div>
      <div>
        <form
          v-if="enabled && supported && showAddForm"
          class="mb-5 flex flex-col gap-3 rounded-lg border border-divider p-4"
          @submit.prevent="addPasskey"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="passkey-name" class="input-label">{{ t('profile.passkey.name') }}</label>
              <input
                id="passkey-name"
                v-model="newName"
                class="input"
                maxlength="100"
                :placeholder="t('profile.passkey.namePlaceholder')"
                autofocus
              />
            </div>
            <div>
              <label for="passkey-add-password" class="input-label">{{
                t('profile.currentPassword')
              }}</label>
              <input
                id="passkey-add-password"
                v-model="newPassword"
                type="password"
                autocomplete="current-password"
                class="input"
                :placeholder="t('profile.passkey.passwordPlaceholder')"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn btn-secondary" :disabled="busy" @click="cancelAdd">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="busy || newPassword.length === 0">
              {{ busy ? t('common.processing') : t('profile.passkey.continue') }}
            </button>
          </div>
        </form>

        <div v-if="loading" class="flex justify-center py-6">
          <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-brand"></div>
        </div>

        <div
          v-else-if="credentials.length === 0"
          class="rounded-lg border border-dashed border-divider px-4 py-8 text-center text-sm text-content-2"
        >
          {{ t('profile.passkey.empty') }}
        </div>

        <div v-else class="divide-y divide-divider">
          <div
            v-for="credential in credentials"
            :key="credential.id"
            class="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <Icon name="key" size="md" class="shrink-0 text-brand-text" />
                <!-- 内联重命名。原来用的是浏览器原生 window.prompt——
                     样式不受控、无法本地化、移动端表现差，与整站设计脱节。 -->
                <input
                  v-if="renamingId === credential.id"
                  ref="renameInputRef"
                  v-model="renameDraft"
                  class="input h-8 max-w-[16rem] flex-1"
                  :aria-label="t('profile.passkey.name')"
                  :disabled="busy"
                  @keydown.enter.prevent="commitRename(credential)"
                  @keydown.esc.prevent="cancelRename"
                />
                <p v-else class="truncate font-medium text-content">
                  {{ credential.name }}
                </p>
                <span v-if="credential.backup" class="badge badge-success">
                  {{ t('profile.passkey.synced') }}
                </span>
              </div>
              <p class="mt-1 text-xs text-content-2">
                {{ t('profile.passkey.createdAt', { date: formatDate(credential.created_at) }) }}
                <template v-if="credential.last_used_at">
                  · {{ t('profile.passkey.lastUsed', { date: formatDate(credential.last_used_at) }) }}
                </template>
              </p>
            </div>
            <div class="flex shrink-0 gap-2">
              <template v-if="renamingId === credential.id">
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  :disabled="busy || !renameDraft.trim()"
                  @click="commitRename(credential)"
                >
                  {{ t('common.save') }}
                </button>
                <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="cancelRename">
                  {{ t('common.cancel') }}
                </button>
              </template>
              <button
                v-else
                type="button"
                class="btn btn-secondary btn-sm"
                :disabled="busy"
                @click="startRename(credential)"
              >
                {{ t('common.edit') }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm !text-danger hover:bg-danger-soft"
                :disabled="busy"
                @click="deletePasskey(credential)"
              >
                {{ t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认：吊销凭据需验证当前密码，防止被窃会话静默移除 Passkey -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50 transition-opacity" @click="closeDeleteDialog"></div>
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="passkey-delete-title"
          class="relative w-full max-w-md transform rounded-token-lg bg-surface p-6 shadow-lg transition-all"
        >
          <h3 id="passkey-delete-title" class="text-lg font-semibold text-content">
            {{ t('profile.passkey.deleteTitle') }}
          </h3>
          <p class="mt-2 text-sm text-content-2">
            {{ t('profile.passkey.deleteConfirm', { name: deleteTarget.name }) }}
          </p>
          <form class="mt-4 space-y-4" @submit.prevent="confirmDelete">
            <div>
              <label for="passkey-delete-password" class="input-label">{{
                t('profile.currentPassword')
              }}</label>
              <input
                id="passkey-delete-password"
                v-model="deletePassword"
                type="password"
                autocomplete="current-password"
                class="input"
                :placeholder="t('profile.passkey.passwordPlaceholder')"
                autofocus
              />
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" :disabled="busy" @click="closeDeleteDialog">
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                class="btn btn-danger"
                :disabled="busy || deletePassword.length === 0"
              >
                {{ busy ? t('common.processing') : t('common.delete') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { passkeyAPI, type PasskeyCredentialSummary } from '@/api'
import { Icon } from '@/components/icons'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ enabled: boolean }>()

const { t } = useI18n()
const appStore = useAppStore()
const supported = passkeyAPI.isSupported()
const loading = ref(false)
const busy = ref(false)
const showAddForm = ref(false)
const newName = ref('')
const newPassword = ref('')
const deleteTarget = ref<PasskeyCredentialSummary | null>(null)
const deletePassword = ref('')
const credentials = ref<PasskeyCredentialSummary[]>([])

// apiClient 拦截器把错误规范化为 { code, reason, message }；
// 透出后端消息（如密码错误），否则回退到通用文案。
function extractErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: string }).message
  return typeof message === 'string' && message.length > 0 ? message : fallback
}

async function loadCredentials(): Promise<void> {
  if (!props.enabled) {
    credentials.value = []
    return
  }
  loading.value = true
  try {
    credentials.value = await passkeyAPI.list()
  } catch (error) {
    // 字符串错误码在 reason 字段（code 是数字状态码）；
    // 设置变更竞态下后端仍可能返回 PASSKEY_DISABLED，静默处理
    const reason = (error as { reason?: string }).reason
    if (reason !== 'PASSKEY_DISABLED') {
      appStore.showError(t('profile.passkey.loadFailed'))
    }
  } finally {
    loading.value = false
  }
}

async function addPasskey(): Promise<void> {
  if (newPassword.value.length === 0) return
  busy.value = true
  try {
    await passkeyAPI.register(newName.value.trim(), newPassword.value)
    appStore.showSuccess(t('profile.passkey.added'))
    cancelAdd()
    await loadCredentials()
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
      appStore.showError(extractErrorMessage(error, t('profile.passkey.addFailed')))
    }
  } finally {
    busy.value = false
  }
}

function cancelAdd(): void {
  showAddForm.value = false
  newName.value = ''
  newPassword.value = ''
}

/* ── 内联重命名 ──
   替代原来的 window.prompt：那个弹窗样式不受控、文案无法本地化、
   移动端体验差，而且与整站设计完全脱节。 */
const renamingId = ref<number | null>(null)
const renameDraft = ref('')
const renameInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(null)

function startRename(credential: PasskeyCredentialSummary): void {
  renamingId.value = credential.id
  renameDraft.value = credential.name
  // v-for 里的 ref 可能是数组，取到实际元素再聚焦
  nextTick(() => {
    const el = renameInputRef.value
    const input = Array.isArray(el) ? el[0] : el
    input?.focus()
    input?.select()
  })
}

function cancelRename(): void {
  renamingId.value = null
  renameDraft.value = ''
}

async function commitRename(credential: PasskeyCredentialSummary): Promise<void> {
  const name = renameDraft.value.trim()
  if (!name || name === credential.name) {
    cancelRename()
    return
  }
  busy.value = true
  try {
    await passkeyAPI.rename(credential.id, name)
    credential.name = name
    appStore.showSuccess(t('profile.passkey.renamed'))
    cancelRename()
  } catch {
    appStore.showError(t('profile.passkey.renameFailed'))
  } finally {
    busy.value = false
  }
}

function deletePasskey(credential: PasskeyCredentialSummary): void {
  deleteTarget.value = credential
  deletePassword.value = ''
}

function closeDeleteDialog(): void {
  deleteTarget.value = null
  deletePassword.value = ''
}

async function confirmDelete(): Promise<void> {
  const credential = deleteTarget.value
  if (!credential || deletePassword.value.length === 0) return
  busy.value = true
  try {
    await passkeyAPI.remove(credential.id, deletePassword.value)
    credentials.value = credentials.value.filter((item) => item.id !== credential.id)
    appStore.showSuccess(t('profile.passkey.deleted'))
    closeDeleteDialog()
  } catch (error) {
    // 密码错误等失败保持对话框打开，允许重试
    appStore.showError(extractErrorMessage(error, t('profile.passkey.deleteFailed')))
  } finally {
    busy.value = false
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

watch(
  () => props.enabled,
  () => {
    void loadCredentials()
  },
  { immediate: true }
)
</script>
