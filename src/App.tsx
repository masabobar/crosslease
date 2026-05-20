import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-semibold tracking-tight">{t('app.name')}</h1>
    </div>
  )
}

export default App
