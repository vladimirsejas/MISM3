from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageStat
base=Path('/tmp/claude-0/-home-user-MISM3/295ecac3-7ca5-5393-95fb-c9ed2e9ed616/scratchpad/hero')
OFF=138   # onde a ilustração original começa
orig=Image.open(base/'heroi_original_4mulheres.webp').convert('RGB')
W=OFF+orig.width
mul=Image.open(base/'mulher2_3x.png').convert('RGBA')
# textura leve de pintura (grão e um fio de desfoque) só na figura, para ficar mais próxima do traço das outras
a=np.asarray(mul).astype(float); rng=np.random.default_rng(7)
ruido=rng.normal(0,2.6,a.shape[:2])[:,:,None]
a[:,:,:3]=np.clip(a[:,:,:3]+ruido*(a[:,:,3:4]>=254),0,255)   # grão só no interior, nunca nas bordas
mul=Image.fromarray(a.astype('uint8'),'RGBA')
# fundo: gradiente de cores da própria ilustração (topo esquerdo -> topo direito)
def media(im): return tuple(int(v) for v in ImageStat.Stat(im).mean)
c1=(251,238,229); c2=(251,237,229)
fundo=Image.new('RGB',(W,298))
for x in range(W):
    t=x/(W-1); cor=tuple(int(c1[i]*(1-t)+c2[i]*t) for i in range(3)); fundo.paste(cor,(x,0,x+1,298))
fundo=fundo.filter(ImageFilter.GaussianBlur(3))
fundo.paste(mul,(0,0),mul)
# máscara: recorta o fundo creme da original na faixa esquerda (folhas/flores ficam NA FRENTE dela); a mulher ruiva (x>=KEY1) fica opaca
arr=np.asarray(orig).astype(float); ref=np.array(c1,float)
dist=np.sqrt(((arr-ref)**2).sum(axis=2))
alfa=np.clip((dist-24)/(52-24),0,1)
KEY0,KEY1=62,96
for x in range(orig.width):
    if x>=KEY1: alfa[:,x]=1
    elif x>KEY0: k=(x-KEY0)/(KEY1-KEY0); alfa[:,x]=alfa[:,x]*(1-k)+k
borda=np.clip(np.arange(orig.width)/28.0,0,1)[None,:]
alfa=alfa*borda
mask=Image.fromarray((alfa*255).astype('uint8'),'L').filter(ImageFilter.GaussianBlur(0.6))
fundo.paste(orig,(OFF,0),mask)
fundo.save(base/'hero_novo2.png'); print(fundo.size)
