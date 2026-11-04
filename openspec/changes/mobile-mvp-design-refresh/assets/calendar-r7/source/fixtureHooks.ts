export const useCoverImage=(url:string)=>({src:url.includes('dinner')?'./dinner.png':'./boardgame.png',loading:false})
export const useMediaImage=()=>({src:'./boardgame.png',loading:false,error:null,retry:()=>undefined})
