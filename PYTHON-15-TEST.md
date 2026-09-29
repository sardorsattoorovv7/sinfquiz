# Python: boshlang‘ich 15 ta savol

Savollar original. Mavzular dasturlash muhitidan funksiya va siklgacha bosqichma-bosqich berilgan. Har bir savolning izohi va kaliti oxirida.

## 1. Kod yozgan o‘quvchi uni ishga tushirib, xatoni ko‘rmoqchi. Qaysi vosita aynan shu ishlarga yordam beradi?

A) Dasturlash muhiti (masalan, IDLE)
B) Fayl siqish dasturi
C) Faqat rasm ko‘ruvchi
D) Printer drayveri

## 2. Quyidagi kod ekranda nima chiqaradi?

```python
print("Fan:", "Python")
```

A) Fan: Python
B) Fan:Python
C) "Fan:" "Python"
D) Hech narsa

## 3. Ikkinchi qatordan so‘ng ball qancha bo‘ladi?

```python
ball = 3
ball = ball + 4
print(ball)
```

A) 7
B) 34
C) 4
D) 3

## 4. Sonning matndan farqini tekshiring. Qaysi ikki tur chiqadi?

```python
print(type("8").__name__)
print(type(8).__name__)
```

A) str / int
B) int / str
C) str / str
D) bool / int

## 5. O‘quvchi input orqali 12 kiritdi. Natijani hisoblash uchun avval nima qilish kerak?

A) int() bilan songa aylantirish
B) print() bilan o‘chirish
C) type() bilan ikki marta bo‘lish
D) Hech narsa: input doim int

## 6. Matn songa aylantirilgach natija qancha?

```python
print(int("12") + 3)
```

A) 15
B) 123
C) 12
D) Xato

## 7. Nol va bo‘sh bo‘lmagan matn uchun natija nima?

```python
print(bool(0))
print(bool("0"))
```

A) False / True
B) False / False
C) True / True
D) True / False

## 8. 17 ta kitobni 5 ta javonga teng joylashtirsak nechta ortadi?

```python
print(17 % 5)
```

A) 2
B) 3
C) 5
D) 12

## 9. Bahosi va davomat sharti birgalikda bajarildimi?

```python
baho = 4
davomat = 80
print(baho >= 4 and davomat >= 75)
```

A) True
B) False
C) 4
D) 80

## 10. Chegara 60 ball. 58 ball uchun qanday xabar chiqadi?

```python
ball = 58
if ball >= 60:
    print("O‘tdi")
else:
    print("Mashq qiling")
```

A) Mashq qiling
B) O‘tdi
C) 58
D) Hech narsa

## 11. Ikkinchi fan nomi qaysi?

```python
fanlar = ["Ingliz tili", "Python", "Matematika"]
print(fanlar[1])
```

A) Python
B) Ingliz tili
C) Matematika
D) 1

## 12. Sikl nechta belgi chiqaradi?

```python
for _ in range(3):
    print("X")
```

A) X / X / X
B) X / X
C) 3
D) Hech narsa

## 13. Sanoq uchga yetganda sikl natijasi nima?

```python
sanoq = 1
while sanoq < 3:
    print(sanoq)
    sanoq += 1
```

A) 1 / 2
B) 1 / 2 / 3
C) 3
D) Cheksiz davom etadi

## 14. Kalit orqali qaysi qiymat olinadi?

```python
kitob = {"nom": "Dasturlash", "bet": 120}
print(kitob["bet"])
```

A) 120
B) Dasturlash
C) bet
D) Xato

## 15. Funksiya chaqirilganda natija nima?

```python
def uch_baravar(son):
    return son * 3
print(uch_baravar(4))
```

A) 12
B) 7
C) 3
D) None

## Javob kaliti

1. A — IDE kodni yozish, ishga tushirish va xatoni tekshirishda yordam beradi.

2. A — print vergul bilan ajratilgan qiymatlar orasiga odatda bitta bo‘sh joy qo‘yadi.

3. A — O‘ngdagi 3 + 4 hisoblanib, yangi 7 qiymati ball ga yoziladi.

4. A — Qo‘shtirnoqli 8 matn; qo‘shtirnoqsiz 8 butun son.

5. A — input har doim str qaytaradi; int("12") butun son hosil qiladi.

6. A — int("12") natijasi 12 bo‘lib, 3 qo‘shilganda 15 chiqadi.

7. A — 0 soni False; "0" esa ichida bitta belgi bor matn, shuning uchun True.

8. A — % bo‘lishdan qolgan qoldiqni hisoblaydi: 17 = 5 × 3 + 2.

9. A — Har ikkala solishtirish True, and natijasi ham True.

10. A — 58 >= 60 yolg‘on, shu sabab else bo‘limi bajariladi.

11. A — Ro‘yxatdagi birinchi indeks 0, ikkinchisi 1.

12. A — range(3) uch aylanish beradi: 0, 1, 2. Har safar bir X chiqariladi.

13. A — 1 va 2 chiqariladi; sanoq 3 bo‘lganda shart False va sikl tugaydi.

14. A — Lug‘atdagi bet kaliti 120 qiymatiga bog‘langan.

15. A — return 4 × 3 = 12 qiymatini qaytaradi, tashqi print uni chiqaradi.
