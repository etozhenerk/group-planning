from pathlib import Path
import struct,zlib,json
from collections import Counter
p=Path('/tmp/somewhere-android-qa-dispatcher-author/saved-glyph-ink-original-runtime/evidence/android-saved-author-bounds.png');data=p.read_bytes();pos=8;compressed=b''
while pos<len(data):
 n=struct.unpack('>I',data[pos:pos+4])[0];kind=data[pos+4:pos+8];body=data[pos+8:pos+8+n];pos+=n+12
 if kind==b'IHDR':w,h,depth,color,_,_,interlace=struct.unpack('>IIBBBBB',body)
 if kind==b'IDAT':compressed+=body
assert depth==8 and color in (2,6) and interlace==0
bpp=3 if color==2 else 4;stride=w*bpp;raw=zlib.decompress(compressed);rows=[];offset=0;previous=bytearray(stride)
def paeth(a,b,c):
 p=a+b-c;pa,pb,pc=abs(p-a),abs(p-b),abs(p-c)
 return a if pa<=pb and pa<=pc else b if pb<=pc else c
for y in range(h):
 filt=raw[offset];offset+=1;row=bytearray(raw[offset:offset+stride]);offset+=stride
 for x in range(stride):
  a=row[x-bpp] if x>=bpp else 0;b=previous[x];c=previous[x-bpp] if x>=bpp else 0
  predictor=0 if filt==0 else a if filt==1 else b if filt==2 else (a+b)//2 if filt==3 else paeth(a,b,c)
  row[x]=(row[x]+predictor)&255
 rows.append(row);previous=row
left,top,right,bottom=277,1185,644,1266
colors=Counter(tuple(rows[y][x*bpp:x*bpp+3]) for y in range(top,bottom) for x in range(left,right));foreground=next(c for c,n in colors.most_common() if min(c)>100 and max(c)-min(c)<35)
ink=[]
for y in range(top,bottom):
 if any(all(abs(rows[y][x*bpp+i]-foreground[i])<=5 for i in range(3)) for x in range(left,right)):ink.append(y-top)
result={'file':str(p),'size':[w,h],'regionPx':[left,top,right,bottom],'foregroundRGB':foreground,'physicalScreenshotInkRows':[min(ink),max(ink)],'absoluteInkRows':[top+min(ink),top+max(ink)],'androidPixelCopyNodeInkRows':[24,62],'actualTypefacePredictedRows':[24,63],'matchesPixelCopy':min(ink)==24 and max(ink)==62,'captionLayoutClipped':False,'observation':'Actual painted glyph rows extend to1247,below perceived cardborder1242;fullfontinkmatchesonepixelrasterrounding'}
print(json.dumps(result,indent=2));Path('/tmp/somewhere-android-qa-dispatcher-author/saved-ink-control/physical-glyph-analysis.json').write_text(json.dumps(result,indent=2)+'\n')
