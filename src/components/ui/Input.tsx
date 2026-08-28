import type{InputHTMLAttributes}from'react'
export function Input({label,error,...p}:InputHTMLAttributes<HTMLInputElement>&{label:string;error?:string}){return <label className="field"><span>{label}</span><input className={'input '+(error?'input-error':'')}{...p}/>{error&&<small>{error}</small>}</label>}
