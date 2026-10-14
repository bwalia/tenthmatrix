from contrast import cr
L = dict(bg='#F7F6F2', surface='#FFFFFF', sunken='#EFEDE7', line='#E0DDD4', line_strong='#7D828A',
 text='#12161A', muted='#474D55', subtle='#5F656D', accent='#0A7A57', accent_hover='#086448', accent_contrast='#FFFFFF',
 accent_soft='#E2F1EA', secondary='#9A5300', secondary_soft='#F8ECDB', success='#1F7A3B', success_soft='#E3F2E6',
 warn='#8A5A00', warn_soft='#FBF0D6', danger='#B42318', danger_soft='#FBE8E5', info='#245BB8', info_soft='#E5EDFA',
 code_bg='#15191C', code_text='#E6E8E3', code_comment='#9AA39F', code_accent='#5FDDAE', focus='#0A7A57')
D = dict(bg='#0E1113', surface='#14181B', raised='#1B2024', sunken='#090B0D', line='#262C31', line_strong='#68717A',
 text='#E8EAE6', muted='#B0B7B4', subtle='#8F9895', accent='#3DD69E', accent_hover='#6BE3B6', accent_contrast='#05261A',
 accent_soft='#10281F', secondary='#F2B252', secondary_soft='#2B2213', success='#62D17E', success_soft='#11261A',
 warn='#F5C451', warn_soft='#2B2410', danger='#FF8E80', danger_soft='#2E1715', info='#8DB4FF', info_soft='#141E33',
 code_bg='#090B0D', code_text='#E6E8E3', code_comment='#8F9895', code_accent='#3DD69E', focus='#3DD69E')
def rows(P, name):
    bgs = [k for k in ('bg','surface','raised','sunken') if k in P]
    out=[f'\n### {name}\n','| Foreground | Background | Ratio | Pass |','|---|---|---|---|']
    def add(f,b,need=4.5):
        r=cr(P[f],P[b]); out.append(f'| `{f}` {P[f]} | `{b}` {P[b]} | {r:.2f}:1 | {"AAA" if r>=7 else "AA" if r>=need else "FAIL"}{" (non-text 3:1)" if need==3 else ""} |')
        if r<need: print('FAIL',name,f,b,round(r,2))
    for f in ('text','muted','subtle','accent','accent_hover','secondary'):
        for b in bgs: add(f,b)
    add('accent_contrast','accent'); add('accent_contrast','accent_hover')
    add('accent','accent_soft'); add('secondary','secondary_soft')
    for s in ('success','warn','danger','info'): add(s,f'{s}_soft'); add(s,'bg'); add(s,'surface')
    add('text','accent_soft')
    add('code_text','code_bg'); add('code_comment','code_bg'); add('code_accent','code_bg')
    for b in bgs: add('line_strong',b,3); add('focus',b,3)
    return '\n'.join(out)
t = rows(L,'Light theme') + '\n' + rows(D,'Dark theme')
open('ratios.md','w').write(t); print(t[:400])
