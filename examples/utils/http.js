import axios from 'axios';
import Element from 'main/index.js';

const { Message } = Element;

// 创建 axios 实例
const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 可在此添加 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  response => {
    const {code, data, msg: message} = response.data;
    // 后端返回格式: { code: 0, data: {}, message: '' }
    // code === 0 表示成功
    if (code === 0) {
      // console.log('data::: ', data);
      return data;
    }
    // 业务错误
    Message.error(message || '请求失败');
    return Promise.reject(new Error(message || '请求失败'));
  },
  error => {
    // HTTP 错误处理
    let message = '网络错误';
    if (error.response) {
      const status = error.response.status;
      const statusMessages = {
        400: '请求参数错误',
        401: '未授权，请重新登录',
        403: '拒绝访问',
        404: '请求资源不存在',
        500: '服务器内部错误',
        502: '网关错误',
        503: '服务不可用',
        504: '网关超时'
      };
      message = statusMessages[status] || `请求失败 (${status})`;
    } else if (error.message.includes('timeout')) {
      message = '请求超时';
    }
    Message.error(message);
    return Promise.reject(error);
  }
);

export default http;
