-- SinfQuiz 7.31: run after 7.30. Catalog-only extension; RLS and previous results unchanged.
begin;
insert into public.sq_space_catalog(id,title,spec) values
('sun-distance','Quyosh yaqinlashsa','{"controls":[{"key":"distance","label":"Quyoshgacha masofa","min":0.5,"max":1.5,"step":0.01,"value":1,"unit":"AU","type":"range"},{"key":"albedo","label":"Qaytarilgan yorug‘lik ulushi","min":0,"max":0.8,"step":0.01,"value":0.3,"unit":"","type":"range"}],"answer":0}'::jsonb),
('ocean-depth','Okean tubiga sayohat','{"controls":[{"key":"targetDepth","label":"Tushish chuqurligi","min":0,"max":10935,"step":0.01,"value":10935,"unit":"m","type":"range"},{"key":"surfaceDensity","label":"Sirtdagi suv zichligi","min":990,"max":1040,"step":1,"value":1025,"unit":"kg/m³","type":"range"},{"key":"compressible","label":"Suv siqilishi","value":"on","options":[["on","Oz siqiladigan suv"],["off","Zichlik o‘zgarmas model"]],"type":"select"},{"key":"mode","label":"Kuzatiladigan obyekt","value":"cabin","options":[["cabin","Odam himoyalangan kabinada"],["air","Yopiq ideal gaz namunasi"]],"type":"select"},{"key":"rating","label":"Kabinaning bosim farqi chegarasi","min":1,"max":1500,"step":1,"value":1200,"unit":"bar","type":"range"}],"answer":1}'::jsonb)
on conflict(id) do update set title=excluded.title,spec=excluded.spec;
commit;
notify pgrst,'reload schema';
