<!doctype html>
<html><head><meta charset="utf-8"><title>Prescription {{ $prescription->id }}</title>@include('pdf._style')</head>
<body>
  <div class="head">
    <h1>Riverside General Hospital</h1>
    <div class="muted">Prescription #{{ $prescription->id }} &middot; {{ \Carbon\Carbon::parse($prescription->prescribed_date)->format('M j, Y') }}</div>
  </div>
  <p><strong>Patient:</strong> {{ $prescription->patient?->user?->name }}<br>
     <strong>Prescribed by:</strong> {{ $prescription->doctor?->user?->name }}<br>
     <strong>Diagnosis:</strong> {{ $prescription->medicalRecord?->diagnosis ?? '—' }}</p>
  <table>
    <tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
    @foreach($prescription->medications ?? [] as $m)
      <tr><td>{{ $m['name'] }}</td><td>{{ $m['dosage'] }}</td><td>{{ $m['frequency'] }}</td><td>{{ $m['duration'] }}</td></tr>
    @endforeach
  </table>
  @if($prescription->instructions)<p><strong>Instructions:</strong> {{ $prescription->instructions }}</p>@endif
  <p class="muted">Valid until {{ \Carbon\Carbon::parse($prescription->valid_until)->format('M j, Y') }}</p>
</body></html>
