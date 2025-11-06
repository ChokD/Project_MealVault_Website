-- คำสั่ง SQL สำหรับลบ policy "weeklymealplan_all" 
-- รันคำสั่งนี้ก่อนสร้าง policy ใหม่

-- ลบ policy เก่า
drop policy if exists weeklymealplan_all on "WeeklyMealPlan";

-- หลังจากลบแล้ว ให้รันคำสั่งสร้าง policy ใหม่:
-- create policy weeklymealplan_all on "WeeklyMealPlan" for all using (true) with check (true);

