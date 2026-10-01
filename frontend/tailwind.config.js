export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"','sans-serif'] },
      colors: {
        brand: { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e' },
        emerald: { 50:'#ecfdf5',100:'#d1fae5',500:'#10b981',600:'#059669',700:'#047857' },
        rose: { 50:'#fff1f2',100:'#ffe4e6',500:'#f43f5e',600:'#e11d48',700:'#be123c' },
        amber: { 50:'#fffbeb',100:'#fef3c7',500:'#f59e0b',600:'#d97706' },
        violet: { 50:'#f5f3ff',100:'#ede9fe',500:'#8b5cf6',600:'#7c3aed' },
      }
    }
  },
  plugins: [],
}
