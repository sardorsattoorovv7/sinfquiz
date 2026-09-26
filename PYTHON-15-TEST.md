# Python — boshlang‘ich 15 ta test

Mavzular: IDE, print(), type(), int, str, bool va operatorlar.

## 1. IDE nima?

A) Faqat rasm chizadigan dastur

B) Internet tezligini o‘lchaydigan qurilma

C) Python ma’lumot turi

D) Kod yozish, ishga tushirish va xatolarni topishga yordam beradigan dasturlash muhiti

## 2. print() funksiyasining asosiy vazifasi nima?

A) Matnni har doim butun songa aylantirish

B) O‘zgaruvchini o‘chirish

C) Ma’lumotni ekranga chiqarish

D) Qiymat turini aniqlash

## 3. Ushbu kod nimani chiqaradi?

```python
print("Salom")
```

A) Xato

B) Salom

C) "Salom"

D) print(Salom)

## 4. Kod natijasini tanlang.

```python
print(type(25))
```

A) <class 'int'>

B) <class 'str'>

C) <class 'bool'>

D) 25

## 5. Qo‘shtirnoq ichidagi qiymatning turi qanday?

```python
print(type("25"))
```

A) <class 'int'>

B) <class 'bool'>

C) <class 'float'>

D) <class 'str'>

## 6. Ushbu kod nimani chiqaradi?

```python
print(int("12") + 3)
```

A) 12

B) Xato

C) 15

D) 123

## 7. Matnga aylantirishdan keyingi natija qaysi?

```python
print(str(7) + "3")
```

A) Xato

B) 73

C) 10

D) <class 'int'>

## 8. bool(0) qanday qiymat beradi?

```python
print(bool(0))
```

A) False

B) True

C) 0.0

D) "False"

## 9. Bo‘sh matn uchun natija nima?

```python
print(bool(""))
```

A) True

B) None

C) Xato

D) False

## 10. Bo‘sh bo‘lmagan matn uchun natija nima?

```python
print(bool("0"))
```

A) 0

B) Xato

C) True

D) False

## 11. Amallar tartibiga ko‘ra natija qaysi?

```python
print(2 + 3 * 4)
```

A) 24

B) 14

C) 20

D) 10

## 12. // operatori ishlatilgan kod natijasi nima?

```python
print(7 // 2)
```

A) 3

B) 3.5

C) 1

D) 4

## 13. % operatori ishlatilgan kod natijasi nima?

```python
print(7 % 2)
```

A) 3

B) 3.5

C) 14

D) 1

## 14. == operatori bu yerda qanday natija beradi?

```python
print(5 == 5)
```

A) 10

B) Xato

C) True

D) False

## 15. Mantiqiy ifoda natijasi nima?

```python
print((3 > 2) and not False)
```

A) 2

B) True

C) False

D) 3

## Javoblar va izohlar

1. **D** — IDE dastur yozish uchun kerakli vositalarni bitta muhitda birlashtiradi.

2. **C** — print() berilgan qiymatlarni standart chiqishga, odatda terminalga yozadi.

3. **B** — Qo‘shtirnoqlar matn chegarasini belgilaydi; odatiy print natijasida ular chiqmaydi.

4. **A** — 25 — butun son. type() uning turini qaytaradi.

5. **D** — Raqamlardan iborat bo‘lsa ham, qo‘shtirnoq ichidagi "25" matndir.

6. **C** — int("12") matnni 12 butun soniga aylantiradi; 12 + 3 = 15.

7. **B** — str(7) — "7". Ikki matn + operatori bilan birlashtiriladi: "7" + "3" = "73".

8. **A** — Nol soni mantiqiy tekshiruvda yolg‘on qiymat hisoblanadi.

9. **D** — Bo‘sh satr "" mantiqiy tekshiruvda False bo‘ladi.

10. **C** — "0" bo‘sh matn emas. Shuning uchun bool("0") True; bu int(0) bilan bir xil emas.

11. **B** — Avval ko‘paytirish: 3 × 4 = 12. Keyin 2 + 12 = 14.

12. **A** — // bo‘lish natijasini pastga qarab butunlashtiradi. 7 // 2 = 3.

13. **D** — % bo‘lishdan qolgan qoldiqni beradi: 7 = 2 × 3 + 1.

14. **C** — == ikkita qiymat tengligini tekshiradi. = esa qiymat berish operatoridir.

15. **B** — 3 > 2 — True; not False — True. True and True natijasi True.

Savollar SinfQuiz uchun original yozildi. Tekshiruv manbalari: Python rasmiy hujjatlaridagi built-in funksiyalar, turlar va IDLE bo‘limlari. Kod natijalari Python interpreteri bilan tekshirildi.
