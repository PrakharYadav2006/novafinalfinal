import numpy as np, json
from scipy import ndimage as ndi
import contourpy
k=np.load('mask.npy'); k[:,1145:]=False
lab,n=ndi.label(k); sizes=ndi.sum(k,lab,range(1,n+1)); k=lab==(int(np.argmax(sizes))+1)
ys,xs=np.nonzero(k); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max(); print('bbox',x0,x1,y0,y1)
# illustrative zone anchors in source-image pixels (x,y)
A={'Z01':(795,640),'Z02':(450,215),'Z03':(300,500),'Z04':(650,430),'Z05':(470,760),'Z06':(470,1015),'Z07':(555,610),'Z08':(1010,420)}
ids=list(A); pts=np.array([A[z] for z in ids],float)
H,W=k.shape
yy,xx=np.mgrid[0:H,0:W]
d=np.stack([(xx-px)**2+(yy-py)**2 for px,py in pts],0)
zone=np.argmin(d,0); zone[~k]=-1
def simplify(p,eps):
    if len(p)<4: return p
    a,b=p[0],p[-1]; ab=b-a; L=np.hypot(*ab)
    if L==0: dist=np.hypot(*(p-a).T)
    else: dist=np.abs(ab[0]*(p[:,1]-a[1])-ab[1]*(p[:,0]-a[0]))/L
    i=int(np.argmax(dist))
    if dist[i]>eps: return np.vstack([simplify(p[:i+1],eps)[:-1],simplify(p[i:],eps)])
    return np.array([a,b])
def path_of(mask,eps=1.6):
    g=np.pad(mask.astype(float),1)
    cg=contourpy.contour_generator(z=g,name='serial')
    lines=cg.lines(0.5); out=[]
    for ln in lines:
        ln=ln-1.0
        if len(ln)<20: continue
        closed=np.allclose(ln[0],ln[-1])
        # split ring in two halves for DP
        if closed:
            m=len(ln)//2; a=simplify(ln[:m+1],eps); b=simplify(ln[m:],eps); r=np.vstack([a[:-1],b])
        else: r=simplify(ln,eps)
        out.append('M'+' L'.join(f'{x-X0:.1f},{y-Y0:.1f}' for x,y in r)+'Z')
    return ' '.join(out)
PAD=16; X0=x0-PAD; Y0=y0-PAD; VW=x1-x0+2*PAD; VH=y1-y0+2*PAD
res={'vb':[0,0,int(VW),int(VH)],'zones':{},'outline':path_of(k,1.6)}
dist_all=ndi.distance_transform_edt(k)
for i,z in enumerate(ids):
    m=zone==i
    dz=ndi.distance_transform_edt(np.pad(m,1))[1:-1,1:-1]
    cy,cx=np.unravel_index(np.argmax(dz),dz.shape)
    res['zones'][z]=dict(d=path_of(m,1.6),cx=float(cx-X0),cy=float(cy-Y0),r=float(dz.max()),area=int(m.sum()))
    print(z,int(m.sum()),'pole',cx,cy,'r',round(dz.max(),1))
json.dump(res,open('geo.json','w'),separators=(',',':'))
import os;print(os.path.getsize('geo.json'),res['vb'])
# preview svg
cols=['#e6b','#9cf','#fc9','#9d9','#f99','#cc6','#bbb','#c9f']
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" width="{VW//2}" height="{VH//2}"><rect width="100%" height="100%" fill="white"/>'
for i,z in enumerate(ids):
    zz=res['zones'][z]; svg+=f'<path d="{zz["d"]}" fill="{cols[i]}" stroke="#333" stroke-width="1" fill-rule="evenodd"/><text x="{zz["cx"]}" y="{zz["cy"]}" font-size="30" text-anchor="middle">{z}</text>'
svg+='</svg>'
open('geo_preview.svg','w').write(svg)
