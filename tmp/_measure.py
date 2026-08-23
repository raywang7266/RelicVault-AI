import sys, importlib.util
spec = importlib.util.spec_from_file_location('mkpdf', r'D:/Users/13315/Desktop/polymercaptial/tmp/make_writeup_pdf.py')
mk = importlib.util.module_from_spec(spec); spec.loader.exec_module(mk)
USABLE_W, COL_W = mk.USABLE_W, mk.COL_W
def m(L, w):
    s=0
    for f in L:
        try: s+=f.wrap(w, 99999)[1]
        except: pass
    return s
print(f'LEFT h={m(mk.build_left_column(), COL_W):.1f} budget={mk.COL_H}')
print(f'RIGHT h={m(mk.build_right_column(), COL_W):.1f} budget={mk.COL_H}')
print(f'BOTTOM h={m(mk.build_bottom_reflections(USABLE_W), USABLE_W):.1f} budget={mk.BOT_H}')
