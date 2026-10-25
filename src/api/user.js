import request from '@/utils/request'

// 用户登录
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data,
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data,
  })
}

// 绑定邮箱
export function bindEmail(email) {
  return request({
    url: '/user/bind-email',
    method: 'post',
    data: { email },
  })
}
