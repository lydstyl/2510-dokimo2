'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalculateProrata } from '../../application/CalculateProrata'
import type {
  CalculateProrataInput,
  CalculateProrataOutput,
} from '../../application/CalculateProrata'

export function ProrataCalculator() {
  const t = useTranslations('prorata')
  const [calculationType, setCalculationType] = useState<'MOVE_IN' | 'MOVE_OUT'>('MOVE_IN')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [result, setResult] = useState<CalculateProrataOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const useCase = new CalculateProrata()

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    try {
      const input: CalculateProrataInput = {
        monthlyRent: parseFloat(monthlyRent),
        startDate,
        endDate,
        calculationType,
      }

      const output = useCase.execute(input)
      setResult(output)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t('errors.calculation'))
      }
    }
  }

  const handleReset = () => {
    setMonthlyRent('')
    setStartDate('')
    setEndDate('')
    setResult(null)
    setError(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-gray-600">{t('description')}</p>

      {/* Calculation Type Selector */}
      <div className="bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('calculationType.label')}
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setCalculationType('MOVE_IN')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              calculationType === 'MOVE_IN'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {t('calculationType.moveIn')}
          </button>
          <button
            type="button"
            onClick={() => setCalculationType('MOVE_OUT')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              calculationType === 'MOVE_OUT'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {t('calculationType.moveOut')}
          </button>
        </div>

        {/* Help text */}
        <p className="mt-3 text-sm text-gray-600">
          {t(`help.${calculationType === 'MOVE_IN' ? 'moveIn' : 'moveOut'}`)}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleCalculate} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form.monthlyRent')}
          </label>
          <input
            type="number"
            id="monthlyRent"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            step="0.01"
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form.startDate')}
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form.endDate')}
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('form.calculate')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t('form.reset')}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('result.title')}
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">{t('result.monthlyRent')}</span>
              <span className="font-medium">{formatCurrency(result.monthlyRent)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">{t('result.period')}</span>
              <span className="font-medium">
                {formatDate(result.startDate)} - {formatDate(result.endDate)}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">{t('result.daysInMonth')}</span>
              <span className="font-medium">{result.daysInMonth}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">{t('result.daysOccupied')}</span>
              <span className="font-medium">{result.daysOccupied}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">{t('result.dailyRate')}</span>
              <span className="font-medium">{formatCurrency(result.dailyRate)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">{t('result.percentage')}</span>
              <span className="font-medium">{result.percentage.toFixed(2)}%</span>
            </div>

            <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg mt-4">
              <span className="font-semibold text-blue-900">{t('result.prorataAmount')}</span>
              <span className="font-bold text-blue-900 text-xl">
                {formatCurrency(result.prorataAmount)}
              </span>
            </div>

            {/* Calculation breakdown */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2 font-medium">{t('result.calculation')}</p>
              <p className="text-sm text-gray-700">
                {formatCurrency(result.dailyRate)} × {result.daysOccupied} jours = {formatCurrency(result.prorataAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({formatCurrency(result.monthlyRent)} ÷ {result.daysInMonth} jours × {result.daysOccupied} jours)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
