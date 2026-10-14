import struct, sys
out, pngs = sys.argv[1], sys.argv[2:]
data = [open(p,'rb').read() for p in pngs]
sizes = [int(p.split('-')[-1].split('.')[0]) for p in pngs]
hdr = struct.pack('<HHH', 0, 1, len(data)); off = 6 + 16*len(data); ents=b''
for s, d in zip(sizes, data):
    ents += struct.pack('<BBBBHHII', s % 256, s % 256, 0, 0, 1, 32, len(d), off); off += len(d)
open(out,'wb').write(hdr + ents + b''.join(data))
