import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, FileText, Calculator, MapPin, FileCheck, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Risk assessment data based on KPNPLT-SST-xxxx.06.1 methodology
interface SpatialRiskItem {
  no: number;
  itemAnalisa: string;
  tipeRisiko: 'tinggi' | 'sedang' | 'rendah';
  parameter: string;
  nilaiRisiko: 1 | 2 | 3;
  bobot: number;
  risiko: number;
  mitigasi: string;
  sumber: string[];
  linkSumber: string[];
  score?: number;
}

interface RiskAssessmentFormData {
  supplierName: string;
  assessmentDate: string;
  assessorName: string;
  spatialRiskItems: SpatialRiskItem[];
  totalScore: number;
  riskClassification: 'rendah' | 'sedang' | 'tinggi';
}

// Predefined spatial risk items as per Form 06.1 specification
const SPATIAL_RISK_TEMPLATE: SpatialRiskItem[] = [
  {
    no: 1,
    itemAnalisa: 'Deforestasi',
    tipeRisiko: 'tinggi',
    parameter: 'Ditemukan adanya Pembukaan Lahan Setelah Desember 2020',
    nilaiRisiko: 1,
    bobot: 45,
    risiko: 45,
    mitigasi: 'Dikeluarkan dari Rantai Pasok',
    sumber: ['Hansen Alert', 'Glad Alert', 'JRC Natural Forest', 'Peta Konsesi Perusahaan'],
    linkSumber: [
      'https://storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12/download.html',
      'http://glad-forest-alert.appspot.com/',
      'https://data.jrc.ec.europa.eu/dataset/10d1b337-b7d1-4938-a048-686c8185b290',
      'https://kpn.co.id/konsesi-maps'
    ]
  },
  {
    no: 2,
    itemAnalisa: 'Legalitas Lahan',
    tipeRisiko: 'tinggi',
    parameter: '1. Tidak memiliki Izin Lahan\n2. Tumpang Tindih dengan Area dilindungi tingkat Global/Nasional',
    nilaiRisiko: 1,
    bobot: 35,
    risiko: 35,
    mitigasi: '1. Dikeluarkan dari Rantai Pasok\n2. Melakukan Pendampingan/pelibatan supplier dalam rangka mendorong proses legalitas lahan. Jika legalitas lahan selesai, supplier dapat dimasukan ke dalam rantai pasok',
    sumber: ['Peta WDPA', 'Peta Kawasan Hutan Indonesia', 'Dokumen Perizinan Lahan (HGU,SHM,dll)', 'Peta Konsesi Perusahaan'],
    linkSumber: [
      'https://www.protectedplanet.net/en/thematic-areas/wdpa?tab=WDPA',
      'https://geoportal.menlhk.go.id/portal/apps/webappviewer/index.html?id=2ee8bdda1d714899955fccbe7fdf8468',
      'https://kpn.co.id/legalitas-lahan',
      'https://kpn.co.id/konsesi-maps'
    ]
  },
  {
    no: 3,
    itemAnalisa: 'Kawasan Gambut',
    tipeRisiko: 'tinggi',
    parameter: 'Plot Sumber TBS overlap dengan peta indikatif gambut fungsi lindung dan Belum Memiliki SK TMAT',
    nilaiRisiko: 1,
    bobot: 10,
    risiko: 10,
    mitigasi: 'Melakukan Pendampingan/pelibatan supplier dalam rangka mendorong proses pengurusan SK TMAT.',
    sumber: ['Peta Areal Gambut', 'Dokumen SK TMAT', 'Peta Konsesi Perusahaan'],
    linkSumber: [
      'https://brgm.go.id/',
      'https://kpn.co.id/sk-tmat-docs',
      'https://kpn.co.id/konsesi-maps'
    ]
  }
];

const riskAssessmentSchema = z.object({
  supplierName: z.string().optional(), // Made optional for draft saves
  assessmentDate: z.string(),
  assessorName: z.string().optional()
});

export default function RiskAssessment() {
  const [, setLocation] = useLocation();
  const [spatialRiskItems, setSpatialRiskItems] = useState<SpatialRiskItem[]>([...SPATIAL_RISK_TEMPLATE]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [riskClassification, setRiskClassification] = useState<'rendah' | 'sedang' | 'tinggi'>('tinggi');
  const { toast } = useToast();
  

  const form = useForm({
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: {
      supplierName: '',
      assessmentDate: new Date().toISOString().split('T')[0],
      assessorName: 'KPN Compliance Administrator'
    }
  });

  

  // Calculate total score and risk classification according to Form 06.1 methodology
  const calculateRiskAssessment = () => {
    // Formula: Score = Σ(Bobot A × Nilai Risiko B) / Total Bobot × 100
    const totalNR = spatialRiskItems.reduce((sum, item) => sum + (item.bobot * item.nilaiRisiko), 0);
    const totalBobot = spatialRiskItems.reduce((sum, item) => sum + item.bobot, 0);
    const calculatedScore = totalBobot > 0 ? (totalNR / totalBobot) : 0;
    
    // Since lower risk value = higher risk level, we need to invert the percentage for display
    // Convert to percentage where higher percentage = better (lower risk)
    const scorePercentage = ((4 - calculatedScore) / 3) * 100;
    
    // Determine risk classification based on exact thresholds from Form 06.1
    let classification: 'rendah' | 'sedang' | 'tinggi';
    if (scorePercentage >= 67) {
      classification = 'rendah';
    } else if (scorePercentage >= 61 && scorePercentage < 67) {
      classification = 'sedang';
    } else {
      classification = 'tinggi';
    }
    
    setTotalScore(Math.round(scorePercentage));
    setRiskClassification(classification);
    
    return { scorePercentage: Math.round(scorePercentage), classification };
  };

  // Calculate risk when items change
  useEffect(() => {
    calculateRiskAssessment();
  }, [spatialRiskItems]);

  // Update risk item
  const updateRiskItem = (index: number, field: keyof SpatialRiskItem, value: any) => {
    const updatedItems = [...spatialRiskItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Update risk calculation when risk level changes
    if (field === 'tipeRisiko') {
      const riskValueMap = { 'tinggi': 1, 'sedang': 2, 'rendah': 3 } as const;
      updatedItems[index].nilaiRisiko = riskValueMap[value as keyof typeof riskValueMap] as 1 | 2 | 3;
      updatedItems[index].risiko = updatedItems[index].bobot * updatedItems[index].nilaiRisiko;
      updatedItems[index].mitigasi = getMitigasiText(updatedItems[index].itemAnalisa, value as any);
    }
    
    setSpatialRiskItems(updatedItems);
  };

  // Get risk level badge color
  const getRiskBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'rendah':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'sedang':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'tinggi':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Handle form submission
  const onSubmit = (data: any) => {
    const formData: RiskAssessmentFormData = {
      supplierName: data.supplierName,
      assessmentDate: data.assessmentDate,
      assessorName: data.assessorName || 'KPN Compliance Administrator',
      spatialRiskItems,
      totalScore,
      riskClassification
    };

    toast({
      title: "Risk Assessment Completed",
      description: `Assessment untuk ${data.supplierName} berhasil disimpan dengan skor ${totalScore}% (${riskClassification.toUpperCase()})`,
    });
  };

  // Get mitigation text for each risk level
  const getMitigasiText = (itemAnalisa: string, tipeRisiko: 'tinggi' | 'sedang' | 'rendah') => {
    const mitigasiMap: Record<string, Record<string, string>> = {
      'Deforestasi': {
        'tinggi': 'Dikeluarkan dari Rantai Pasok',
        'sedang': 'Melakukan monitoring berkala dan sosialisasi kebijakan NDPE',
        'rendah': 'Tetap melakukan monitoring berkala sesuai prosedur standar'
      },
      'Legalitas Lahan': {
        'tinggi': '1. Dikeluarkan dari Rantai Pasok\n2. Melakukan Pendampingan/pelibatan supplier dalam rangka mendorong proses legalitas lahan. Jika legalitas lahan selesai, supplier dapat dimasukan ke dalam rantai pasok',
        'sedang': 'Melakukan pendampingan intensif dan monitoring proses legalitas',
        'rendah': 'Monitoring berkala untuk memastikan kepatuhan berkelanjutan'
      },
      'Kawasan Gambut': {
        'tinggi': 'Melakukan Pendampingan/pelibatan supplier dalam rangka mendorong proses pengurusan SK TMAT.',
        'sedang': 'Monitoring proses bimbingan teknis dan pendampingan SK TMAT',
        'rendah': 'Monitoring berkala untuk memastikan kepatuhan SK TMAT'
      }
    };
    return mitigasiMap[itemAnalisa]?.[tipeRisiko] || '';
  };

  // Get parameter text for each risk level
  const getParameterText = (itemAnalisa: string, tipeRisiko: 'tinggi' | 'sedang' | 'rendah') => {
    const parameterMap: Record<string, Record<string, string>> = {
      'Deforestasi': {
        'tinggi': 'Ditemukan adanya Pembukaan Lahan Setelah Desember 2020',
        'sedang': 'Ada Indikasi Deforestasi di Sekitar Area dan PKS Terima TBS Luar',
        'rendah': 'Sumber TBS Berasal dari Kebun yang dikembangkan sebelum Desember 2020'
      },
      'Legalitas Lahan': {
        'tinggi': '1. Tidak memiliki Izin Lahan\n2. Tumpang Tindih dengan Area dilindungi tingkat Global/Nasional',
        'sedang': '1. Memiliki Izin\n2. Tidak ada indikasi Tumpang Tindih dengan Area dilindungi tingkat Global\n3. Ada indikasi tumpang tindih dengan kawasan hutan tingkat nasional namun dapat dibuktikan, hak atas lahan lebih dulu terbit dibanding penetapan status kawasan hutan',
        'rendah': '1. Memiliki Izin\n2. Berada di Kawasan APL'
      },
      'Kawasan Gambut': {
        'tinggi': 'Plot Sumber TBS overlap dengan peta indikatif gambut fungsi lindung dan Belum Memiliki SK TMAT',
        'sedang': 'Plot Sumber TBS overlap dengan peta indikatif gambut fungsi lindung dan sedang proses bimbingan teknis dari kementerian terkait dalam rangka penerbitan SK TMAT',
        'rendah': '1. Plot Sumber TBS overlap dengan peta indikatif gambut fungsi lindung dan Memiliki SK TMAT\n2. Plot Sumber TBS tidak overlap dengan peta indikatif gambut'
      }
    };
    return parameterMap[itemAnalisa]?.[tipeRisiko] || '';
  };

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                KPNPLT-SST-xxxx.06.1
              </h1>
              <h2 className="text-xl font-semibold text-gray-800 mt-2">
                FORM METODE PERHITUNGAN TINGKAT RISIKO DAN MITIGASINYA
              </h2>
              <p className="text-gray-600 mt-1">
                I. ANALISA RISIKO SPASIAL
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Pemeriksaan ini dilaksanakan sebelum perjanjian kerja sama dengan pemasok diberlakukan
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">Overall Risk Score</div>
                <div className="flex items-center gap-2">
                  <Badge className={getRiskBadgeColor(riskClassification)}>
                    {riskClassification.toUpperCase()}
                  </Badge>
                  <span className="text-lg font-bold">{totalScore}%</span>
                </div>
              </div>
              <Button 
                onClick={() => setLocation('/supply-chain-workflow')}
                variant="outline"
                data-testid="button-back-workflow"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workflow
              </Button>
            </div>
          </div>
        </div>
        

        {/* Supplier Information Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Informasi Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Supplier</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama supplier" {...field} data-testid="input-supplier-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assessmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Assessment</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-assessment-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assessorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Assessor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama assessor" {...field} data-testid="input-assessor-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  data-testid="button-submit-assessment"
                >
                  Simpan Assessment Risiko
                  <Calculator className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Spatial Risk Assessment Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              I. ANALISA RISIKO SPASIAL
            </CardTitle>
            <CardDescription>
              Form metode perhitungan tingkat risiko dan mitigasinya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead className="w-32">Item Analisa</TableHead>
                    <TableHead className="w-24">Tipe Risiko</TableHead>
                    <TableHead className="w-96">Parameter</TableHead>
                    <TableHead className="w-20">Bobot (A)</TableHead>
                    <TableHead className="w-20">Nilai Risiko (B)</TableHead>
                    <TableHead className="w-20">NR (A×B)</TableHead>
                    <TableHead className="w-96">Mitigasi</TableHead>
                    <TableHead className="w-32">Sumber</TableHead>
                    <TableHead className="w-32">Link Sumber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spatialRiskItems.map((item, index) => (
                    <TableRow key={index} className="border-b">
                      <TableCell className="font-medium">{item.no}</TableCell>
                      <TableCell className="font-semibold">{item.itemAnalisa}</TableCell>
                      <TableCell>
                        <Select 
                          value={item.tipeRisiko} 
                          onValueChange={(value) => {
                            updateRiskItem(index, 'tipeRisiko', value);
                            updateRiskItem(index, 'parameter', getParameterText(item.itemAnalisa, value as any));
                          }}
                          data-testid={`select-risk-type-${index}`}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tinggi">Tinggi</SelectItem>
                            <SelectItem value="sedang">Sedang</SelectItem>
                            <SelectItem value="rendah">Rendah</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm whitespace-pre-wrap">
                          {getParameterText(item.itemAnalisa, item.tipeRisiko)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">{item.bobot}</TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge className={getRiskBadgeColor(item.tipeRisiko)}>
                          {item.nilaiRisiko}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">{item.risiko}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm whitespace-pre-wrap">
                          {getMitigasiText(item.itemAnalisa, item.tipeRisiko)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {item.sumber.map((source, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span>{idx + 1}.</span>
                              <span>{source}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {item.linkSumber.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span>{idx + 1}.</span>
                              <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 truncate max-w-xs"
                              >
                                <ExternalLink className="w-3 h-3 inline mr-1" />
                                Link
                              </a>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Risk Classification and Calculation */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Klasifikasi Tingkat Risiko</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Rendah:</span>
                      <Badge className="bg-green-100 text-green-800">≥67%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sedang:</span>
                      <Badge className="bg-yellow-100 text-yellow-800">61&lt;x&lt;67</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tinggi:</span>
                      <Badge className="bg-red-100 text-red-800">≤60%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Perhitungan Risiko</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm font-mono bg-gray-50 p-3 rounded">
                      <div>NR = Bobot A × Nilai Risiko B</div>
                      <div>Total NR = Σ(Bobot A × Nilai Risiko B)</div>
                      <div>Score = ((4 - (Total NR / Total Bobot)) / 3) × 100</div>
                      <div className="text-xs text-gray-600 mt-1">*Formula adjusted for inverse scoring (1=tinggi, 3=rendah)</div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{totalScore}%</div>
                        <div className="text-sm text-gray-600">Total Score</div>
                        <Badge className={`${getRiskBadgeColor(riskClassification)} text-lg px-4 py-2 mt-2`}>
                          {riskClassification.toUpperCase()}
                        </Badge>
                      </div>
                      <Progress value={totalScore} className="mt-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}