import Link from 'next/link'
import { GraduationCap, School, ShieldCheck } from 'lucide-react'

const roles = [
  {
    href: '/register/candidate',
    icon: GraduationCap,
    title: 'מועמדת',
    description: 'מחפשת סטאג\' או משרה בגן / בית ספר ברשת',
    color: '#5B3AAB',
  },
  {
    href: '/register/institution',
    icon: School,
    title: 'מוסד',
    description: 'גן ילדים או בית ספר יסודי המחפש מועמדות',
    color: '#00B4CC',
  },
  {
    href: '/register/admin',
    icon: ShieldCheck,
    title: 'מנהל רשת',
    description: 'כניסה לצוות המטה בלבד — נדרש אישור',
    color: '#C9A84C',
  },
]

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0F8' }}>
      <div className="w-full max-w-lg px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold" style={{ color: '#5B3AAB' }}>הרשמה למערכת</h1>
          <p className="text-gray-500 mt-2">בחרי את סוג החשבון שלך</p>
        </div>

        <div className="space-y-4">
          {roles.map(role => {
            const Icon = role.icon
            return (
              <Link
                key={role.href}
                href={role.href}
                className="flex items-center gap-5 bg-white rounded-2xl shadow p-5 hover:shadow-md transition-shadow group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: role.color + '18' }}
                >
                  <Icon size={24} style={{ color: role.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 group-hover:text-[#5B3AAB] transition-colors">
                    {role.title}
                  </div>
                  <div className="text-sm text-gray-500">{role.description}</div>
                </div>
                <span className="text-gray-300 group-hover:text-[#5B3AAB] transition-colors text-xl">‹</span>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          כבר רשומה?{' '}
          <a href="/login" className="font-medium" style={{ color: '#00B4CC' }}>
            כניסה
          </a>
        </p>
      </div>
    </div>
  )
}
