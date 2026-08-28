import axios from 'axios'
import { create } from 'zustand'
import { authApi, type User } from '../api/auth'
import { ACCESS_TOKEN_KEY } from '../api/api'
type AuthState={user:User|null;token:string|null;isAuthenticated:boolean;isAuthChecked:boolean;isHHConnected:boolean;login:(email:string,password:string)=>Promise<User>;register:(email:string,password:string)=>Promise<User>;checkAuth:()=>Promise<void>;connectHH:()=>void;disconnectHH:()=>void;logout:()=>void}
export const useAuthStore=create<AuthState>((set,get)=>{
  const saveSession=async(request:Promise<{accessToken:string;user?:User}>)=>{const result=await request;localStorage.setItem(ACCESS_TOKEN_KEY,result.accessToken);const user=result.user??await authApi.me();set({token:result.accessToken,user,isAuthenticated:true,isAuthChecked:true});return user}
  return{user:null,token:localStorage.getItem(ACCESS_TOKEN_KEY),isAuthenticated:false,isAuthChecked:false,isHHConnected:localStorage.getItem('hhConnected')==='true',
    login:(email,password)=>saveSession(authApi.login({email,password})),register:(email,password)=>saveSession(authApi.register({email,password})),
    checkAuth:async()=>{const token=localStorage.getItem(ACCESS_TOKEN_KEY);if(!token){set({token:null,user:null,isAuthenticated:false,isAuthChecked:true});return}try{const user=await authApi.me();set({token,user,isAuthenticated:true,isAuthChecked:true})}catch(error){if(axios.isAxiosError(error)&&error.response?.status===401)get().logout();else set({token,user:null,isAuthenticated:false,isAuthChecked:true})}},
    connectHH:()=>{localStorage.setItem('hhConnected','true');set({isHHConnected:true})},
    disconnectHH:()=>{localStorage.removeItem('hhConnected');set({isHHConnected:false})},
    logout:()=>{localStorage.removeItem(ACCESS_TOKEN_KEY);localStorage.removeItem('hhConnected');set({token:null,user:null,isAuthenticated:false,isAuthChecked:true,isHHConnected:false})}
  }
})
