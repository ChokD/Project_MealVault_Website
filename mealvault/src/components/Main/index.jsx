import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Main() {
  return (
    <div className="bg-green-50 min-h-screen p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-green-800">MealVault</h1>
        <nav className="space-x-4">
          <Button variant="ghost">หน้าหลัก</Button>
          <Button variant="ghost">เมนูอาหาร</Button>
          <Button variant="ghost">ชุมชน</Button>
          <Button variant="ghost">เกี่ยวกับเรา</Button>
          <Button variant="outline">เข้าสู่ระบบ</Button>
        </nav>
      </header>

      {/* Search Section */}
      <section className="max-w-3xl mx-auto text-center mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-green-700">
          ค้นหาเมนูจากวัตถุดิบของคุณ
        </h2>
        <div className="flex items-center bg-white rounded-full shadow-md px-4 py-2">
          <Search className="text-green-500 mr-2" />
          <Input placeholder="ใส่วัตถุดิบ เช่น ไข่ไก่ ผักบุ้ง..." className="flex-1 border-none focus:outline-none" />
          <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 ml-2">
            ค้นหา
          </Button>
        </div>
      </section>

      {/* Recommended Recipes */}
      <section className="mb-10">
        <h3 className="text-xl font-bold text-green-800 mb-4">เมนูแนะนำ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['ผัดกะเพรา', 'ต้มยำกุ้ง', 'ข้าวผัดไข่'].map((name, i) => (
            <Card key={i} className="hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <img
                  src={`https://source.unsplash.com/featured/?thai,food,${i}`}
                  alt={name}
                  className="rounded-xl w-full h-40 object-cover mb-4"
                />
                <h4 className="text-lg font-semibold text-green-700">{name}</h4>
                <p className="text-sm text-gray-600 mt-2">ดูสูตรและวิธีทำ →</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-green-700 mt-20">
        © 2025 MealVault. All rights reserved.
      </footer>
    </div>
  );
}
