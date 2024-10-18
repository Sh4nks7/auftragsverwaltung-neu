'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Plus, Edit2, Trash2, Eye, FileText, Printer, X } from 'lucide-react'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { ScrollArea } from "../components/ui/scroll-area"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ToastProvider, useToast } from '../components/ui/use-toast'

const isBrowser = typeof window !== 'undefined';

type Wichtigkeit = 'Hoch' | 'Normal' | 'Niedrig'

type Kommentar = {
  id: number
  autor: string
  text: string
  erstelltAm: Date
}

type Auftrag = {
  id: number
  nummer: string
  kunde: string
  adresse: string
  mieter: string
  telNr: string
  email: string
  problem: string
  pdfDateien: string[]
  status: string
  erstelltAm: Date
  wichtigkeit: Wichtigkeit
  kommentare: Kommentar[]
  termin?: Date
}

type KachelProps = {
  titel: string
  auftraege: Auftrag[]
  onEdit: (auftrag: Auftrag) => void
  onDelete: (id: number) => void
  onDrop: (item: Auftrag, zielStatus: string) => void
  onView: (auftrag: Auftrag) => void
  onAddComment: (auftragId: number, kommentar: Omit<Kommentar, 'id' | 'erstelltAm'>) => void
  onSetTermin: (auftragId: number, termin: Date | undefined) => void
}

const formatiereDatum = (datum: Date) => {
  return format(datum, 'dd.MM.yyyy HH:mm', { locale: de })
}

const getWichtigkeitFarbe = (wichtigkeit: Wichtigkeit) => {
  switch (wichtigkeit) {
    case 'Hoch':
      return 'bg-red-100 text-red-800'
    case 'Normal':
      return 'bg-white text-gray-800'
    case 'Niedrig':
      return 'bg-green-100 text-green-800'
  }
}

const getKachelFarbe = (titel: string) => {
  switch (titel) {
    case 'Erledigt':
      return 'bg-green-500 text-white'
    case 'Rechnung':
      return 'bg-blue-200 text-blue-800'
    case 'Termin':
      return 'bg-yellow-200 text-yellow-800'
    case 'In Bearbeitung':
      return 'bg-green-200 text-green-800'
    case 'Nochmal vorbeigehen':
      return 'bg-red-200 text-red-800'
    default:
      return 'bg-white'
  }
}

const ZiehbarerAuftrag: React.FC<{ 
  auftrag: Auftrag; 
  onEdit: (auftrag: Auftrag) => void; 
  onDelete: (id: number) => void;
  onView: (auftrag: Auftrag) => void;
}> = ({ auftrag, onEdit, onDelete, onView }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'auftrag',
    item: auftrag,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  const wichtigkeitFarbe = getWichtigkeitFarbe(auftrag.wichtigkeit)

  return (
    <div ref={drag} className={`mb-2 p-2 rounded ${isDragging ? 'opacity-50' : ''} ${wichtigkeitFarbe}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">{auftrag.nummer}</span>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => onView(auftrag)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onEdit(auftrag)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDelete(auftrag.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="font-semibold">{auftrag.kunde}</p>
      <p className="text-sm">{auftrag.adresse}</p>
      <p className="text-sm whitespace-pre-wrap">{auftrag.problem}</p>
    </div>
  )
}

const Kachel: React.FC<KachelProps> = ({ titel, auftraege, onEdit, onDelete, onDrop, onView, onAddComment, onSetTermin }) => {
  const [, drop] = useDrop(() => ({
    accept: 'auftrag',
    drop: (item: Auftrag) => onDrop(item, titel),
  }))

  const kachelFarbe = getKachelFarbe(titel)

  return (
    <Card className={`w-full h-[calc(100vh-10rem)] flex flex-col ${kachelFarbe}`} ref={drop}>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium leading-none">{titel}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {auftraege.map((auftrag) => (
          <ZiehbarerAuftrag 
            key={auftrag.id} 
            auftrag={auftrag} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onView={onView}
          />
        ))}
      </CardContent>
    </Card>
  )
}

const DruckbarerAuftrag: React.FC<{ auftrag: Auftrag }> = ({ auftrag }) => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auftragsdetails</h1>
      <div className="grid gap-4">
        <p><strong>Nummer:</strong> {auftrag.nummer}</p>
        <p><strong>Kunde:</strong> {auftrag.kunde}</p>
        <p><strong>Adresse:</strong> {auftrag.adresse}</p>
        <p><strong>Mieter:</strong> {auftrag.mieter}</p>
        <p><strong>Tel. Nr.:</strong> {auftrag.telNr}</p>
        <p><strong>E-Mail:</strong> {auftrag.email}</p>
        <p><strong>Problem:</strong> <pre className="whitespace-pre-wrap">{auftrag.problem}</pre></p>
        <p><strong>Status:</strong> {auftrag.status}</p>
        <p><strong>Wichtigkeit:</strong> {auftrag.wichtigkeit}</p>
        <p><strong>Erstellt am:</strong> {formatiereDatum(auftrag.erstelltAm)}</p>
        {auftrag.termin && <p><strong>Termin:</strong> {formatiereDatum(auftrag.termin)}</p>}
        {auftrag.pdfDateien && auftrag.pdfDateien.length > 0 && (
          <div>
            <strong>Dateien:</strong>
            <ul>
              {auftrag.pdfDateien.map((datei, index) => (
                <li key={index}>{datei}</li>
              ))}
            </ul>
          </div>
        )}
        {auftrag.kommentare && auftrag.kommentare.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mt-4 mb-2">Kommentare</h2>
            {auftrag.kommentare.map((kommentar, index) => (
              <div key={index} className="mb-2">
                <p><strong>{kommentar.autor}</strong> - {formatiereDatum(kommentar.erstelltAm)}</p>
                <p>{kommentar.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const KommentarBereich: React.FC<{ 
  auftrag: Auftrag; 
  onAddComment: (auftragId: number, kommentar: Omit<Kommentar, 'id' | 'erstelltAm'>) => void;
  onSetTermin: (auftragId: number, termin: Date | undefined) => void;
}> = ({ auftrag, onAddComment, onSetTermin }) => {
  const [neuerKommentar, setNeuerKommentar] = useState({ autor: '', text: '' })
  const [neuerTermin, setNeuerTermin] = useState<Date | null>(auftrag.termin || null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (neuerKommentar.autor.trim() && neuerKommentar.text.trim()) {
      onAddComment(auftrag.id, neuerKommentar)
      setNeuerKommentar({ autor: '', text: '' })
    }
    if (neuerTermin !== auftrag.termin) {
      onSetTermin(auftrag.id, neuerTermin || undefined)
    }
  }

  const handleDateChange = (date: Date | null) => {
    setNeuerTermin(date)
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Kommentare und Termin</h3>
      {auftrag.termin && (
        <div className="mb-4 p-2 bg-yellow-100 rounded">
          <strong>Aktueller Termin:</strong> {formatiereDatum(auftrag.termin)}
        </div>
      )}
      {auftrag.kommentare.map((kommentar, index) => (
        <div key={index} className="mb-2 p-2 bg-gray-100 rounded">
          <p className="font-semibold">{kommentar.autor} - {formatiereDatum(kommentar.erstelltAm)}</p>
          <p>{kommentar.text}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <Input
          placeholder="Ihr Name"
          value={neuerKommentar.autor}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNeuerKommentar({ ...neuerKommentar, autor: e.target.value })}
        />
        <Textarea
          placeholder="Ihr Kommentar"
          value={neuerKommentar.text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNeuerKommentar({ ...neuerKommentar, text: e.target.value })}
        />
        <div className="relative">
          <DatePicker
            selected={neuerTermin}
            onChange={handleDateChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="dd.MM.yyyy HH:mm"
            customInput={<Input />}
            placeholderText="Termin auswählen"
          />
        </div>
        <Button type="submit">Kommentar/Termin hinzufügen</Button>
      </form>
    </div>
  )
}

const Auftragsverwaltung: React.FC = () => {
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [kacheln] = useState(['Offen', 'In Bearbeitung', 'Termin', 'Nochmal vorbeigehen', 'Erledigt', 'Rechnung'])
  const [neuerAuftrag, setNeuerAuftrag] = useState<Omit<Auftrag, 'id' | 'status' | 'nummer' | 'erstelltAm' | 'kommentare'>>({
    kunde: '', adresse: '', mieter: '', telNr: '', email: '', problem: '', wichtigkeit: 'Normal', pdfDateien: []
  })
  const [bearbeiteterAuftrag, setBearbeiteterAuftrag] = useState<Auftrag | null>(null)
  const [angesehenerAuftrag, setAngesehenerAuftrag] = useState<Auftrag | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [nextAuftragNummer, setNextAuftragNummer] = useState(1)
  const printRef = useRef<HTMLDivElement>(null)
  const [filterWichtigkeit, setFilterWichtigkeit] = useState<Wichtigkeit | 'Alle'>('Alle')
  const { addToast } = useToast()

  const handleAddToast = (toast: ToastProps) => {
    addToast(toast)
  }

  useEffect(() => {
    const fetchAuftraege = async () => {
      try {
        const response = await axios.get('/api/auftraege')
        setAuftraege(response.data)
      } catch  (error) {
        console.error('Fehler beim Laden der Aufträge:', error)
        handleAddToast({
          message: "Die Aufträge konnten nicht geladen werden.",
          type: "error"
        })
      }
    }

    fetchAuftraege()
    
    const storedNextNummer =   localStorage.getItem('nextAuftragNummer')
    if (storedNextNummer) {
      setNextAuftragNummer(parseInt(storedNextNummer, 10))
    }
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (bearbeiteterAuftrag) {
      setBearbeiteterAuftrag({ ...bearbeiteterAuftrag, [name]: value })
    } else {
      setNeuerAuftrag({ ...neuerAuftrag, [name]: value })
    }
  }, [bearbeiteterAuftrag, neuerAuftrag])

  const handleWichtigkeitChange = useCallback((value: Wichtigkeit) => {
    if (bearbeiteterAuftrag) {
      setBearbeiteterAuftrag({ ...bearbeiteterAuftrag, wichtigkeit: value })
    } else {
      setNeuerAuftrag({ ...neuerAuftrag, wichtigkeit: value })
    }
  }, [bearbeiteterAuftrag, neuerAuftrag])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const fileNames = files.map(file => file.name)
      if (bearbeiteterAuftrag) {
        setBearbeiteterAuftrag({ ...bearbeiteterAuftrag, pdfDateien: [...bearbeiteterAuftrag.pdfDateien, ...fileNames] })
      } else {
        setNeuerAuftrag({ ...neuerAuftrag, pdfDateien: fileNames })
      }
    }
  }, [bearbeiteterAuftrag, neuerAuftrag])

  const handleSubmit = useCallback(async () => {
    try {
      if (bearbeiteterAuftrag) {
        await axios.put(`/api/auftraege/${bearbeiteterAuftrag.id}`, bearbeiteterAuftrag)
        setAuftraege(prevAuftraege => 
          prevAuftraege.map(a => a.id === bearbeiteterAuftrag.id ? bearbeiteterAuftrag : a)
        )
        handleAddToast({
          message: "Auftrag aktualisiert",
          description: "Die Änderungen wurden erfolgreich gespeichert.",
          type: "success"
        })
      } else {
        const newAuftrag: Omit<Auftrag, 'id'> = { 
          ...neuerAuftrag, 
          status: 'Offen',
          nummer: `${nextAuftragNummer.toString().padStart(4, '0')}`,
          erstelltAm: new Date(),
          kommentare: [],
          pdfDateien: neuerAuftrag.pdfDateien || []
        }
        const response = await axios.post('/api/auftraege', newAuftrag)
        setAuftraege(prevAuftraege => [...prevAuftraege, response.data])
        setNextAuftragNummer(prev => {
          const next = prev + 1
          localStorage.setItem('nextAuftragNummer', next.toString())
          return next
        })
        handleAddToast({
          message: "Neuer Auftrag erstellt",
          description: "Der Auftrag wurde erfolgreich hinzugefügt.",
          type: "success"
        })
      }
      setIsDialogOpen(false)
      setNeuerAuftrag({ kunde: '', adresse: '', mieter: '', telNr: '', email: '', problem: '', wichtigkeit: 'Normal', pdfDateien: [] })
      setBearbeiteterAuftrag(null)
    } catch (error) {
      console.error('Fehler beim Speichern des Auftrags:', error)
      handleAddToast({
        message: "Fehler",
        description: "Es gab ein Problem beim Speichern des Auftrags.",
        type: "error"
      })
    }
  }, [bearbeiteterAuftrag, neuerAuftrag, nextAuftragNummer])

  const handleEdit = useCallback((auftrag: Auftrag) => {
    setBearbeiteterAuftrag(auftrag)
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    try {
      await axios.delete(`/api/auftraege/${id}`)
      setAuftraege(prevAuftraege => prevAuftraege.filter(a => a.id !== id))
      handleAddToast({
        message: "Auftrag gelöscht",
        description: "Der Auftrag wurde erfolgreich gelöscht.",
        type: "success"
      })
    } catch (error) {
      console.error('Fehler beim Löschen des Auftrags:', error)
      handleAddToast({
        message: "Fehler",
        description: "Es gab ein Problem beim Löschen des Auftrags.",
        type: "error"
      })
    }
  }, [])

  const handleDrop = useCallback(async (item: Auftrag, zielStatus: string) => {
    try {
      const updatedAuftrag = { ...item, status: zielStatus }
      await axios.put(`/api/auftraege/${item.id}`, updatedAuftrag)
      setAuftraege(prevAuftraege => 
        prevAuftraege.map(a => 
          a.id === item.id ? updatedAuftrag : a
        )
      )
      handleAddToast({
        message: "Status aktualisiert",
        description: `Der Auftrag wurde in "${zielStatus}" verschoben.`,
        type: "success"
      })
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Auftragsstatus:', error)
      handleAddToast({
        message: "Fehler",
        description: "Es gab ein Problem beim Aktualisieren des Auftragsstatus.",
        type: "error"
      })
    }
  }, [])

  const handleView = useCallback((auftrag: Auftrag) => {
    setAngesehenerAuftrag(auftrag)
    setIsViewDialogOpen(true)
  }, [])

  const handleAddComment = useCallback(async (auftragId: number, kommentar: Omit<Kommentar, 'id' | 'erstelltAm'>) => {
    try {
      const auftrag = auftraege.find(a => a.id === auftragId)
      if (auftrag) {
        const updatedAuftrag = {
          ...auftrag,
          kommentare: [
            ...auftrag.kommentare,
            { ...kommentar, id: Date.now(), erstelltAm: new Date() }
          ]
        }
        await axios.put(`/api/auftraege/${auftragId}`, updatedAuftrag)
        setAuftraege(prevAuftraege => 
          prevAuftraege.map(a => a.id === auftragId ? updatedAuftrag : a)
        )
        handleAddToast({
          message: "Kommentar hinzugefügt",
          description: "Der Kommentar wurde erfolgreich gespeichert.",
          type: "success"
        })
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Kommentars:', error)
      handleAddToast({
        message: "Fehler",
        description: "Es gab ein Problem beim Hinzufügen des Kommentars.",
        type: "error"
      })
    }
  }, [auftraege])

  const handleSetTermin = useCallback(async (auftragId: number, termin: Date | undefined) => {
    try {
      const auftrag = auftraege.find(a => a.id === auftragId)
      if (auftrag) {
        const updatedAuftrag = { ...auftrag, termin }
        await axios.put(`/api/auftraege/${auftragId}`, updatedAuftrag)
        setAuftraege(prevAuftraege => 
          prevAuftraege.map(a => a.id === auftragId ? updatedAuftrag : a)
        )
        if (angesehenerAuftrag && angesehenerAuftrag.id === auftragId) {
          setAngesehenerAuftrag(updatedAuftrag)
        }
        handleAddToast({
          message: "Termin aktualisiert",
          description: "Der Termin wurde erfolgreich gespeichert.",
          type: "success"
        })
      }
    } catch (error) {
      console.error('Fehler beim Setzen des Termins:', error)
      handleAddToast({
        message: "Fehler",
        description: "Es gab ein Problem beim Setzen des Termins.",
        type: "error"
      })
    }
  }, [auftraege, angesehenerAuftrag])

  const handlePrint = useCallback(() => {
    const printContent = printRef.current
    if (printContent && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write('<html><head><title>Auftrag Drucken</title>')
        printWindow.document.write('<style>')
        printWindow.document.write(`
          body { font-family: Arial, sans-serif; }
          .print-content { max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          p { margin-bottom: 10px; }
          strong { font-weight: bold; }
          pre { white-space: pre-wrap; font-family: inherit; }
        `)
        printWindow.document.write('</style>')
        printWindow.document.write('</head><body>')
        printWindow.document.write('<div class="print-content">')
        printWindow.document.write(printContent.innerHTML || '')
        printWindow.document.write('</div></body></html>')
        printWindow.document.close()
        printWindow.print()
      }
    }
  }, [])


  const handleFilterWichtigkeit = (value: Wichtigkeit | 'Alle') => {
    setFilterWichtigkeit(value)
  }

  const filteredAuftraege = useMemo(() => {
    return kacheln.map(kachel => ({
      titel: kachel,
      auftraege: auftraege
        .filter(a => a.status === kachel)
        .filter(a => filterWichtigkeit === 'Alle' || a.wichtigkeit === filterWichtigkeit)
    }))
  }, [auftraege, kacheln, filterWichtigkeit])

  return (
      <DndProvider backend={HTML5Backend}>
        <div className="p-4 max-w-full overflow-x-hidden">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">Auftragsverwaltung</h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select onValueChange={handleFilterWichtigkeit} defaultValue="Alle">
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Wichtigkeit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alle">Alle</SelectItem>
                  <SelectItem value="Hoch">Hoch</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Niedrig">Niedrig</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Neuer Auftrag</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{bearbeiteterAuftrag ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input name="kunde" placeholder="Kunde" value={bearbeiteterAuftrag?.kunde || neuerAuftrag.kunde} onChange={handleInputChange} />
                    <Input name="adresse" placeholder="Adresse" value={bearbeiteterAuftrag?.adresse || neuerAuftrag.adresse} onChange={handleInputChange} />
                    <Input name="mieter" placeholder="Mieter" value={bearbeiteterAuftrag?.mieter || neuerAuftrag.mieter} onChange={handleInputChange} />
                    <Input name="telNr" placeholder="Tel. Nr." value={bearbeiteterAuftrag?.telNr || neuerAuftrag.telNr} onChange={handleInputChange} />
                    <Input name="email" placeholder="E-Mail" value={bearbeiteterAuftrag?.email || neuerAuftrag.email} onChange={handleInputChange} />
                    <Textarea 
                      name="problem" 
                      placeholder="Problem" 
                      value={bearbeiteterAuftrag?.problem || neuerAuftrag.problem} 
                      onChange={handleInputChange}
                      rows={5}
                    />
                    <Input name="pdfDateien" type="file" accept=".pdf" onChange={handleFileChange} multiple />
                    {(bearbeiteterAuftrag?.pdfDateien || []).map((datei, index) => (
                      <div key={index} className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="text-sm">{datei}</span>
                      </div>
                    ))}
                    <Select onValueChange={handleWichtigkeitChange} defaultValue={bearbeiteterAuftrag?.wichtigkeit || neuerAuftrag.wichtigkeit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wichtigkeit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hoch">Hoch</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Niedrig">Niedrig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit}>{bearbeiteterAuftrag ? 'Aktualisieren' : 'Hinzufügen'}</Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {filteredAuftraege.map(({ titel, auftraege }) => (
              <Kachel 
                key={titel} 
                titel={titel} 
                auftraege={auftraege}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDrop={handleDrop}
                onView={handleView}
                onAddComment={handleAddComment}
                onSetTermin={handleSetTermin}
              />
            ))}
          </div>
        </div>
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[425px] h-[80vh] max-h-[80vh] flex flex-col p-0">
            <DialogHeader className="px-4 py-2 flex justify-between items-center">
              <DialogTitle>Auftragsdetails</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsViewDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <ScrollArea className="flex-grow">
              <div className="px-4 py-4 space-y-4">
                <p><strong>Nummer:</strong> {angesehenerAuftrag?.nummer}</p>
                <p><strong>Kunde:</strong> {angesehenerAuftrag?.kunde}</p>
                <p><strong>Adresse:</strong> {angesehenerAuftrag?.adresse}</p>
                <p><strong>Mieter:</strong> {angesehenerAuftrag?.mieter}</p>
                <p><strong>Tel. Nr.:</strong> {angesehenerAuftrag?.telNr}</p>
                <p><strong>E-Mail:</strong>
                  <a href={`mailto:${angesehenerAuftrag?.email}`} className="ml-2 text-blue-500 hover:underline">
                    {angesehenerAuftrag?.email}
                  </a>
                </p>
                <div>
                  <strong>Problem:</strong>
                  <pre className="mt-2 whitespace-pre-wrap">{angesehenerAuftrag?.problem}</pre>
                </div>
                <p><strong>Status:</strong> {angesehenerAuftrag?.status}</p>
                <p><strong>Wichtigkeit:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded ${getWichtigkeitFarbe(angesehenerAuftrag?.wichtigkeit as Wichtigkeit)}`}>
                    {angesehenerAuftrag?.wichtigkeit}
                  </span>
                </p>
                <p><strong>Erstellt am:</strong> {angesehenerAuftrag?.erstelltAm && formatiereDatum(angesehenerAuftrag.erstelltAm)}</p>
                {angesehenerAuftrag?.pdfDateien && angesehenerAuftrag.pdfDateien.length > 0 && (
                  <div>
                    <strong>Dateien:</strong>
                    {angesehenerAuftrag.pdfDateien.map((datei, index) => (
                      <div key={index} className="ml-2 mt-1">
                        <span className="text-blue-500">{datei}</span>
                      </div>
                    ))}
                  </div>
                )}
                {angesehenerAuftrag && (
                  <KommentarBereich 
                    auftrag={angesehenerAuftrag} 
                    onAddComment={handleAddComment}
                    onSetTermin={handleSetTermin}
                  />
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="px-4 py-2">
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Drucken
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {angesehenerAuftrag && <DruckbarerAuftrag auftrag={angesehenerAuftrag} />}
          </div>
        </div>
      </DndProvider>
  )
}

const AuftragsverwaltungWrapper: React.FC = () => {
  return (
    <ToastProvider>
      <Auftragsverwaltung />
    </ToastProvider>
  )
}

export default AuftragsverwaltungWrapper