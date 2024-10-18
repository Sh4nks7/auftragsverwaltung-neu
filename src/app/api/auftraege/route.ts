import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM auftraege');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching auftraege:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    nummer,
    kunde,
    adresse,
    mieter,
    telNr,
    email,
    problem,
    status,
    wichtigkeit,
    pdfDateien,
    kommentare,
    erstelltAm,
    termin
  } = body;

  try {
    const [result] = await db.query(
      `
      INSERT INTO auftraege 
      (nummer, kunde, adresse, mieter, telNr, email, problem, status, wichtigkeit, pdfDateien, kommentare, erstelltAm, termin) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        nummer,
        kunde,
        adresse,
        mieter,
        telNr,
        email,
        problem,
        status,
        wichtigkeit,
        JSON.stringify(pdfDateien),
        JSON.stringify(kommentare),
        erstelltAm,
        termin
      ]
    );

    if ('insertId' in result) {
      const newAuftragId = result.insertId;
      const newAuftrag = {
        id: newAuftragId,
        nummer,
        kunde,
        adresse,
        mieter,
        telNr,
        email,
        problem,
        status,
        wichtigkeit,
        pdfDateien,
        kommentare,
        erstelltAm,
        termin
      };

      return NextResponse.json(newAuftrag, { status: 201 });
    } else {
      throw new Error('Failed to insert new Auftrag');
    }
  } catch (error) {
    console.error('Error creating auftrag:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}