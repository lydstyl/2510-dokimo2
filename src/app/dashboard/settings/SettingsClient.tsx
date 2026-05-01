'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type ApiKey = {
  id: string
  name: string
  prefix: string
  createdAt: string
}

type Props = {
  initialKeys: ApiKey[]
}

const MCP_URL = 'http://192.168.3.102:3008/mcp'

export function SettingsClient({ initialKeys }: Props) {
  const t = useTranslations('settings.apiKeys')

  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!newKeyName.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setGeneratedKey(data.key)
      setKeys(prev => [{ id: data.id, name: data.name, prefix: data.prefix, createdAt: data.createdAt }, ...prev])
    } catch {
      setError('Erreur lors de la génération de la clé.')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    if (!generatedKey) return
    navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function closeGenerateModal() {
    setShowGenerateModal(false)
    setNewKeyName('')
    setGeneratedKey(null)
    setCopied(false)
    setError(null)
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/api-keys/${revokeTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setKeys(prev => prev.filter(k => k.id !== revokeTarget.id))
      setRevokeTarget(null)
    } catch {
      setError('Erreur lors de la révocation.')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* API Keys section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('sectionTitle')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shrink-0"
          >
            {t('generate')}
          </button>
        </div>

        {/* MCP URL info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1">{t('mcpUrl')}</p>
          <code className="text-sm text-gray-800 font-mono">{MCP_URL}</code>
        </div>

        {/* Keys table */}
        <div className="mt-6">
          {keys.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">{t('noKeys')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">{t('keyName')}</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">{t('keyPrefix')}</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">{t('createdAt')}</th>
                  <th className="text-right py-2 font-medium text-gray-600">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">{k.name}</td>
                    <td className="py-3 pr-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                        {k.prefix}…
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {new Date(k.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setRevokeTarget(k)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        {t('revoke')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Generate modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('generate')}</h3>

              {!generatedKey ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('nameLabel')}
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    placeholder={t('namePlaceholder')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={closeGenerateModal}
                      className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={generating || !newKeyName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {generating ? '…' : t('generate')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                    <p className="text-sm font-medium text-amber-800">{t('newKeyWarning')}</p>
                  </div>
                  <div className="bg-gray-900 rounded-md p-3 flex items-center justify-between gap-3">
                    <code className="text-green-400 text-xs font-mono break-all">{generatedKey}</code>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                    >
                      {copied ? t('copied') : t('copyKey')}
                    </button>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-md border text-xs text-gray-600">
                    <p className="font-medium mb-1">Configuration Claude Desktop / client MCP :</p>
                    <pre className="text-gray-700 whitespace-pre-wrap">{`{
  "mcpServers": {
    "dokimo": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${generatedKey}"
      }
    }
  }
}`}</pre>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={closeGenerateModal}
                      className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirmation modal */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">{t('revoke')}</h3>
            <p className="text-sm text-gray-600 mb-1">
              {t('confirmRevoke')}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-6">« {revokeTarget.name} »</p>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRevokeTarget(null); setError(null) }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {revoking ? '…' : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
