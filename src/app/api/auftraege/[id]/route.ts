import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
      const [rows] = await db.query('SELECT * FROM auftraege WHERE id = ?', [id]);
      
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(rows[0]);
      } else {
        return NextResponse.json({ error: 'Auftrag not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error fetching auftrag:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  
  export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    const body = await request.json();
  
    const {
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
      termin
    } = body;
  
    try {
      const updateFields = [
        'kunde = ?',
        'adresse = ?',
        'mieter = ?',
        'telNr = ?',
        'email = ?',
        'problem = ?',
        'status = ?',
        'wichtigkeit = ?',
        'pdfDateien = ?',
        'kommentare = ?',
        'termin = ?'
      ];
  
      const updateValues = [
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
        termin,
        id
      ];
  
      const [result] = await db.query(
        `UPDATE auftraege SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
  
      if ('affectedRows' in result && result.affectedRows > 0) {
        return NextResponse.json({ message: 'Auftrag updated successfully' });
      } else {
        return NextResponse.json({ error: 'Auftrag not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error updating auftrag:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  
  export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
      const [result] = await db.query('DELETE FROM auftraege WHERE id = ?', [id]);
  
      if ('affectedRows' in result && result.affectedRows > 0) {
        return NextResponse.json({ message: 'Auftrag deleted successfully' });
      } else {
        return NextResponse.json({ error: 'Auftrag not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error deleting auftrag:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }