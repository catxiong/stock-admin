<template>
  <section class="main-layout" :class="{hideSidebar: !sidebarOpened}">
    <section class="side-bar">
      <div class="side-logo">
        <router-link to="/" class="wh-full flex-center">
          <span class="logo-title" v-if="sidebarOpened">Stock</span>
          <span v-else>S</span>
        </router-link>
      </div>
      <el-scrollbar class="side-bar-menu">
        <el-menu
          router
          :default-active="currentRoute.path"
          :collapse="!sidebarOpened"
          :collapse-transition="false"
          background-color="transparent"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <!-- 单级菜单 -->
            <el-menu-item v-if="!route.children && !route.meta?.hidden" :index="route.path">
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon"/>
              </el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
            <!-- 多级菜单 -->
            <el-sub-menu v-else-if="route.children && !route.meta?.hidden" :index="route.path">
              <template #title>
                <el-icon v-if="route.meta?.icon">
                  <component :is="route.meta.icon"/>
                </el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              <el-menu-item v-for="child in route.children" :key="child.path" :index="child.path">
                <el-icon v-if="child.meta?.icon">
                  <component :is="child.meta.icon"/>
                </el-icon>
                <template #title>{{ child.meta?.title }}</template>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </section>
    <section class="main-container">
      <section class="main-top">
        <div class="navbar">
          <div class="navbar-left" @click="toggleSidebar">
            <el-icon class="toggle-icon" :class="{'is-active': sidebarOpened}">
              <Expand v-if="!sidebarOpened"/>
              <Fold v-else/>
            </el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                {{ item.meta?.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="navbar-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><UserFilled/></el-icon>
                {{ userInfo.nickname || 'admin' }}
                <el-icon><ArrowDown/></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </section>
      <section class="app-main">
        <router-view v-slot="{Component}">
          <keep-alive>
            <component :is="Component"/>
          </keep-alive>
        </router-view>
      </section>
    </section>
  </section>
</template>

<script setup>
import {useRoute, useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/Auth'
import dbUtils from '@/utils/util.storage'

const currentRoute = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarOpened = ref(true)
const userInfo = computed(() => dbUtils.get('userInfo') || {})

// 过滤隐藏路由
const menuRoutes = computed(() => {
  const layout = router.options.routes.find(r => r.path === '/')
  if (!layout) return []
  return layout.children.filter(r => !r.meta?.hidden)
})

const breadcrumbs = computed(() => {
  const matched = currentRoute.matched.filter(item => item.meta?.title)
  return matched
})

function toggleSidebar() {
  sidebarOpened.value = !sidebarOpened.value
}

function handleCommand(command) {
  if (command === 'logout') {
    authStore.logout()
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  width: 100%;
  height: 100%;

  .side-bar {
    width: $sidebar-width;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 999;
    background-color: var(--menu-background);
    transition: width 0.28s;

    .side-logo {
      height: $navbar-height;
      line-height: $navbar-height;
      text-align: center;
      font-weight: bold;
      font-size: 22px;
      color: #409eff;

      .wh-full {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-decoration: none;
        color: inherit;
      }
    }

    .side-bar-menu {
      height: calc(100vh - #{$navbar-height});
    }
  }

  .main-container {
    margin-left: $sidebar-width;
    transition: margin-left 0.28s;
    min-height: 100vh;
    background-color: var(--main-background);

    .main-top {
      position: sticky;
      top: 0;
      z-index: 9;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

      .navbar {
        height: $navbar-height;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 15px;

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;

          .toggle-icon {
            font-size: 20px;

            &:hover {
              color: #409eff;
            }
          }
        }

        .navbar-right {
          .user-info {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            font-size: 14px;

            &:hover {
              color: #409eff;
            }
          }
        }
      }
    }

    .app-main {
      padding: 20px;
      min-height: calc(100vh - #{$navbar-height});
    }
  }
}

.hideSidebar {
  .side-bar {
    width: $sidebar-width-collapsed;
  }

  .main-container {
    margin-left: $sidebar-width-collapsed;
  }
}
</style>
