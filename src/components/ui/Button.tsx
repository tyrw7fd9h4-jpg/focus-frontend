import type{ButtonHTMLAttributes,ReactNode}from'react';import'./ui.css'
type P=ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'danger';loading?:boolean;children:ReactNode}
export function Button({variant='primary',loading,children,className='',disabled,...p}:P){return <button className={'button button-'+variant+' '+className} disabled={disabled||loading}{...p}>{loading&&<span className="spinner"/>}{children}</button>}
