import type{HTMLAttributes}from'react';export function Card({className='',...p}:HTMLAttributes<HTMLDivElement>){return <div className={'card '+className}{...p}/>}
