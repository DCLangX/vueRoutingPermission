import router, { adminRoutes, endRoutes } from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login'] // no redirect whitelist

router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done()
    } else {
      const hasGetUserInfo = store.getters.name
      if (hasGetUserInfo) {
        // const allowRoles = to.meta.roles
        // const userRole = store.getters.role
        // console.log(to.fullPath, allowRoles, userRole)
        // if (allowRoles.includes(userRole)) {
        next()
        // } else {
        //   next('/404')
        // }
      } else {
        try {
          // get user info
          await store.dispatch('user/getInfo')
          const userRole = store.getters.role
          console.log('添加前路由', router.options.routes)
          const addRoutes = userRole === 'admin' ? [...adminRoutes, ...endRoutes] : endRoutes
          router.addRoutes(addRoutes)
          router.options.routes = router.options.routes.concat(addRoutes)
          console.log('添加后路由', router.options.routes)
          next(to.fullPath)
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/logout')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/
    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
