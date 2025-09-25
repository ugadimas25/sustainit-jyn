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
import { apiRequest, queryClient } from '@/lib/queryClient';
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

interface NonSpatialRiskItem {
  no: number;
  itemAnalisa: string;
  tipeRisiko: 'tinggi' | 'sedang' | 'rendah';
  parameter: string;
  nilaiRisiko: 1 | 2 | 3;
  mitigasi: string;
  sumber: string[];
  linkSumber: string[];
}

interface RiskAssessmentFormData {
  supplierName: string;
  assessmentDate: string;
  assessorName: string;
  spatialRiskItems: SpatialRiskItem[];
  nonSpatialRiskItems: NonSpatialRiskItem[];
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
  },
  {
    no: 4,
    itemAnalisa: 'Indigenous People',
    tipeRisiko: 'tinggi',
    parameter: '1. Ada Overlap dengan Peta BRWA, ada kasus pemberitaan konflik dan belum ada bukti penyelesaian\n2. Tidak Memiliki SOP mengenai Padiatapan dan Penanganan Keluhan Stakeholder',
    nilaiRisiko: 1,
    bobot: 10,
    risiko: 10,
    mitigasi: 'Melakukan Pendampingan/pelibatan supplier, dalam upaya penyelesaian konflik',
    sumber: ['Peta Wilayah Adat (BRWA)', 'Bukti FPIC'],
    linkSumber: [
      'https://brwa.or.id/',
      'https://kpn.co.id/fpic-docs'
    ]
  }
];

// Non-Spatial Risk Template - Media Coverage Analysis (Referensi untuk Supplier Engagement)
const NON_SPATIAL_RISK_TEMPLATE: NonSpatialRiskItem[] = [
  {
    no: 1,
    itemAnalisa: 'Lingkungan',
    tipeRisiko: 'tinggi',
    parameter: '1. Jika terdapat pemberitaan di media cetak/elektronik mengenai pencemaran lingkungan, perusakan ekosistem, atau pelanggaran izin lingkungan yang signifikan, Seperti : Deforestasi, Pembakaran Lahan, Limbah\n2. Tidak memiliki upaya perbaikan',
    nilaiRisiko: 3,
    mitigasi: '1. Sosialisasi Kebijakan Perusahaan\n2. Melakukan gap analisis dan pendampingan untuk pemenuhan persyaratan yang sesuai dengan regulasi lingkungan',
    sumber: ['Media Cetak', 'Media Elektronik'],
    linkSumber: ['https://news.google.com/', 'https://kompas.com/']
  },
  {
    no: 2,
    itemAnalisa: 'Keanekaragaman Hayati',
    tipeRisiko: 'tinggi',
    parameter: '1. Terdapat Konflik Satwa RTE (Rare, Threatened, and Endangered)\n2. Tidak Memiliki SOP Penanganan Konflik Satwa',
    nilaiRisiko: 3,
    mitigasi: 'Mendorong Supplier membentuk Sistem Penanganan Konflik Satwa Liar termasuk laporan penangannya',
    sumber: ['Media Cetak', 'Media Elektronik'],
    linkSumber: ['https://news.google.com/', 'https://kompas.com/']
  },
  {
    no: 3,
    itemAnalisa: 'Hak Pihak Ke 3 termasuk Hak-Hak Masyarakat adat (Pengelolaan Plasma dan FPIC)',
    tipeRisiko: 'tinggi',
    parameter: '1. Jika terdapat pemberitaan di media cetak/elektronik tentang konflik lahan dengan masyarakat adat atau petani plasma, termasuk pelanggaran prinsip FPIC (Free, Prior, Informed Consent)\n2. Tidak Memiliki SOP mengenai Padiatapan dan Penanganan Keluhan Stakeholder',
    nilaiRisiko: 3,
    mitigasi: 'Melakukan Pendampingan/pelibatan supplier, dalam upaya penyelesaian konflik',
    sumber: ['Media Cetak', 'Media Elektronik'],
    linkSumber: ['https://news.google.com/', 'https://kompas.com/']
  },
  {
    no: 4,
    itemAnalisa: 'Hak Buruh dan Hak Asasi Manusia',
    tipeRisiko: 'tinggi',
    parameter: '1. Jika Terdapat Pemberitaan Baik Media Cetak Maupun Media Elektronik Seperti : Terdapat Pelanggaran HAM/buruh (kerja paksa, intimidasi, kekerasan)\n2. Tidak Memiliki Sistem Penanganan Keluhan Karyawan',
    nilaiRisiko: 3,
    mitigasi: 'Melakukan Pendampingan/pelibatan supplier, dalam upaya penyelesaian konflik',
    sumber: ['Media Cetak', 'Media Elektronik'],
    linkSumber: ['https://news.google.com/', 'https://kompas.com/']
  },
  {
    no: 5,
    itemAnalisa: 'Perpajakan, Antikorupsi, perdagangan dan Bea Cukai',
    tipeRisiko: 'tinggi',
    parameter: 'Jika Terdapat Release dari Pemerintah/Instansi Terkait, Mengenai : 1. Penggelapan Pajak 2. Kasus Korupsi dan Suap',
    nilaiRisiko: 3,
    mitigasi: 'Di Keluarkan dari Rantai Pasok',
    sumber: ['Media Cetak', 'Media Elektronik', 'Rilis Pemerintah'],
    linkSumber: ['https://news.google.com/', 'https://kompas.com/', 'https://kemenkeu.go.id/']
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
  const [nonSpatialRiskItems, setNonSpatialRiskItems] = useState<NonSpatialRiskItem[]>([...NON_SPATIAL_RISK_TEMPLATE]);
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

  

  // Calculate total score and risk classification according to Risk Analysis methodology
  const calculateRiskAssessment = () => {
    // Calculate spatial risk score (using weight-based formula)
    const spatialTotalNR = spatialRiskItems.reduce((sum, item) => sum + (item.bobot * item.nilaiRisiko), 0);
    const spatialTotalBobot = spatialRiskItems.reduce((sum, item) => sum + item.bobot, 0);
    const spatialScore = spatialTotalBobot > 0 ? (spatialTotalNR / spatialTotalBobot) : 0;
    
    // Calculate non-spatial risk score (simple average of risk values)
    const nonSpatialTotal = nonSpatialRiskItems.reduce((sum, item) => sum + item.nilaiRisiko, 0);
    const nonSpatialCount = nonSpatialRiskItems.length;
    const nonSpatialScore = nonSpatialCount > 0 ? (nonSpatialTotal / nonSpatialCount) : 0;
    
    // Combined risk assessment: spatial analysis weighted at 70%, non-spatial at 30%
    const combinedScore = (spatialScore * 0.7) + (nonSpatialScore * 0.3);
    
    // Convert to percentage scale (1-3 scale to 0-100%)
    // For spatial: tinggi(1)→~0%, sedang(2)→~50%, rendah(3)→~100%
    // For non-spatial: tinggi(3)→~100%, sedang(2)→~50%, rendah(1)→~0% (inverted)
    const scorePercentage = ((combinedScore - 1) / 2) * 100;
    
    // Determine risk classification based on combined score
    let classification: 'rendah' | 'sedang' | 'tinggi';
    if (scorePercentage >= 70) {
      classification = 'rendah';   // Low risk
    } else if (scorePercentage >= 40 && scorePercentage < 70) {
      classification = 'sedang';   // Medium risk  
    } else {
      classification = 'tinggi';   // High risk
    }
    
    setTotalScore(Math.round(scorePercentage));
    setRiskClassification(classification);
    
    return { scorePercentage: Math.round(scorePercentage), classification };
  };

  // Calculate risk when items change
  useEffect(() => {
    calculateRiskAssessment();
  }, [spatialRiskItems, nonSpatialRiskItems]);

  // Update risk item
  const updateRiskItem = (index: number, field: keyof SpatialRiskItem, value: any) => {
    const updatedItems = [...spatialRiskItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Update risk calculation when risk level changes
    if (field === 'tipeRisiko') {
      const riskValueMap = { 'tinggi': 1, 'sedang': 2, 'rendah': 3 } as const;
      updatedItems[index].nilaiRisiko = riskValueMap[value as keyof typeof riskValueMap] as 1 | 2 | 3;
      updatedItems[index].risiko = updatedItems[index].bobot * updatedItems[index].nilaiRisiko;
      updatedItems[index].parameter = getParameterText(updatedItems[index].itemAnalisa, value as any);
      updatedItems[index].mitigasi = getMitigasiText(updatedItems[index].itemAnalisa, value as any);
    }
    
    setSpatialRiskItems(updatedItems);
  };

  // Update non-spatial risk item
  const updateNonSpatialRiskItem = (index: number, field: keyof NonSpatialRiskItem, value: any) => {
    const updatedItems = [...nonSpatialRiskItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Update when risk level changes
    if (field === 'tipeRisiko') {
      // Special case for Perpajakan item (only High=3, Low=1, no Medium)
      if (updatedItems[index].itemAnalisa === 'Perpajakan, Antikorupsi, perdagangan dan Bea Cukai') {
        const riskValueMap = { 'tinggi': 3, 'rendah': 1 } as const;
        updatedItems[index].nilaiRisiko = riskValueMap[value as keyof typeof riskValueMap] as 1 | 3;
      } else {
        // Standard mapping for other items (High=3, Medium=2, Low=1)
        const riskValueMap = { 'tinggi': 3, 'sedang': 2, 'rendah': 1 } as const;
        updatedItems[index].nilaiRisiko = riskValueMap[value as keyof typeof riskValueMap] as 1 | 2 | 3;
      }
      updatedItems[index].parameter = getNonSpatialParameterText(updatedItems[index].itemAnalisa, value as any);
      updatedItems[index].mitigasi = getNonSpatialMitigasiText(updatedItems[index].itemAnalisa, value as any);
    }
    
    setNonSpatialRiskItems(updatedItems);
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

  // Risk Assessment API mutation
  const createRiskAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      // Prepare the risk assessment data for backend
      const riskAssessmentData = {
        supplierName: data.supplierName,
        assessorName: data.assessorName || 'KPN Compliance Administrator',
        assessmentDate: new Date(data.assessmentDate).toISOString(),
        status: 'Complete',
        overallScore: totalScore,
        riskClassification: riskClassification,
        spatialRiskScore: calculateSpatialScore(),
        spatialRiskLevel: getSpatialRiskLevel(),
        nonSpatialRiskScore: calculateNonSpatialScore(),
        nonSpatialRiskLevel: getNonSpatialRiskLevel(),
        riskItemScores: buildRiskItemScores(),
        mitigationActions: buildMitigationActions(),
        notes: `Risk analysis completed on ${new Date().toLocaleDateString()} with ${spatialRiskItems.length} spatial and ${nonSpatialRiskItems.length} non-spatial risk items evaluated.`
      };

      const response = await apiRequest('POST', '/api/risk-assessments', riskAssessmentData);
      return response.json();
    },
    onSuccess: (result) => {
      // Invalidate risk assessments cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/risk-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      toast({
        title: "Risk Analysis Completed",
        description: `Assessment untuk ${form.getValues('supplierName')} berhasil disimpan dengan skor ${totalScore}% (${riskClassification.toUpperCase()})`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menyimpan risk analysis. Silakan coba lagi.",
        variant: "destructive"
      });
      console.error('Risk assessment submission error:', error);
    }
  });

  // Helper functions for backend data preparation
  const calculateSpatialScore = () => {
    const totalNR = spatialRiskItems.reduce((sum, item) => sum + (item.bobot * item.nilaiRisiko), 0);
    const totalBobot = spatialRiskItems.reduce((sum, item) => sum + item.bobot, 0);
    return totalBobot > 0 ? (totalNR / totalBobot) : 0;
  };

  const calculateNonSpatialScore = () => {
    const total = nonSpatialRiskItems.reduce((sum, item) => sum + item.nilaiRisiko, 0);
    const count = nonSpatialRiskItems.length;
    return count > 0 ? (total / count) : 0;
  };

  const getSpatialRiskLevel = () => {
    const score = calculateSpatialScore();
    if (score <= 1.5) return 'high';
    if (score <= 2.5) return 'medium';
    return 'low';
  };

  const getNonSpatialRiskLevel = () => {
    const score = calculateNonSpatialScore();
    if (score >= 2.5) return 'high';
    if (score >= 1.5) return 'medium';
    return 'low';
  };

  const buildRiskItemScores = () => {
    const scores: any = {};
    
    // Add spatial risk items
    spatialRiskItems.forEach(item => {
      const key = item.itemAnalisa.toLowerCase().replace(/[^a-z0-9]/g, '_');
      scores[key] = {
        score: item.nilaiRisiko,
        level: item.tipeRisiko,
        parameter: item.parameter,
        weight: item.bobot,
        mitigasi: item.mitigasi
      };
    });

    // Add non-spatial risk items
    nonSpatialRiskItems.forEach(item => {
      const key = item.itemAnalisa.toLowerCase().replace(/[^a-z0-9]/g, '_');
      scores[key] = {
        score: item.nilaiRisiko,
        level: item.tipeRisiko,
        parameter: item.parameter,
        mitigasi: item.mitigasi
      };
    });

    return scores;
  };

  const buildMitigationActions = () => {
    const actions: any[] = [];
    
    // Add spatial mitigation actions
    spatialRiskItems.forEach(item => {
      if (item.mitigasi && item.mitigasi.trim()) {
        actions.push({
          riskItem: item.itemAnalisa,
          action: item.mitigasi,
          status: 'pending',
          targetDate: '',
          assignedTo: '',
          progress: 0
        });
      }
    });

    // Add non-spatial mitigation actions
    nonSpatialRiskItems.forEach(item => {
      if (item.mitigasi && item.mitigasi.trim()) {
        actions.push({
          riskItem: item.itemAnalisa,
          action: item.mitigasi,
          status: 'pending',
          targetDate: '',
          assignedTo: '',
          progress: 0
        });
      }
    });

    return actions;
  };

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      await createRiskAssessmentMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error submitting risk assessment:', error);
    }
  };

  // Get mitigation text for each risk level
  const getMitigasiText = (itemAnalisa: string, tipeRisiko: 'tinggi' | 'sedang' | 'rendah') => {
    const mitigasiMap: Record<string, Record<string, string>> = {
      'Deforestasi': {
        'tinggi': 'Dikeluarkan dari Rantai Pasok',
        'sedang': '1. Monitoring berkala plot sumber TBS\n2. Sosialisasi kebijakan perusahaan kepada supplier dan menetapkan syarat perjanjian jual beli yang ketat',
        'rendah': '1. Monitoring berkala plot sumber TBS\n2. Sosialisasi kebijakan perusahaan kepada supplier dan menetapkan syarat perjanjian jual beli yang ketat'
      },
      'Legalitas Lahan': {
        'tinggi': '1. Dikeluarkan dari Rantai Pasok\n2. Melakukan Pendampingan/pelibatan supplier dalam rangka mendorong proses legalitas lahan. Jika legalitas lahan selesai, supplier dapat dimasukan ke dalam rantai pasok',
        'sedang': '1. Sosialisasi kebijakan perusahaan kepada supplier\n2. Melakukan Pendampingan/pelibatan supplier dalam rangka mendorong proses legalitas lahan. Jika legalitas lahan selesai, supplier dapat dimasukan ke dalam rantai pasok',
        'rendah': 'Monitoring Berkala plot Sumber TBS'
      },
      'Kawasan Gambut': {
        'tinggi': 'Melakukan Pendampingan/pelibatan supplier dalam rangka mendorong proses pengurusan SK TMAT.',
        'sedang': 'Sosialisasi kebijakan perusahaan kepada supplier.',
        'rendah': 'Sosialisasi kebijakan perusahaan kepada supplier.'
      },
      'Indigenous People': {
        'tinggi': 'Melakukan Pendampingan/pelibatan supplier, dalam upaya penyelesaian konflik',
        'sedang': '1. Dorong percepatan proses resolusi konflik melalui mekanisme mediasi terbuka\n2. Sosialisasi kebijakan perusahaan kepada supplier',
        'rendah': 'Monitoring isu sosial secara berkala untuk deteksi dini potensi konflik baru.'
      }
    };
    return mitigasiMap[itemAnalisa]?.[tipeRisiko] || '';
  };

  // Get parameter text for each risk level
  const getParameterText = (itemAnalisa: string, tipeRisiko: 'tinggi' | 'sedang' | 'rendah') => {
    const parameterMap: Record<string, Record<string, string>> = {
      'Deforestasi': {
        'tinggi': 'Ditemukan adanya Pembukaan Lahan Setelah Desember 2020',
        'sedang': 'Ada Indikasi Deforestasi di Sekitar Area dan PKS Terima TBS',
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
        'rendah': '1. Plot Sumber TBS overlap dengan peta indikatif gambut fungsi lindung dan Sudah memiliki SK TMAT\n2. Tidak Berada dikawasan Gambut'
      },
      'Indigenous People': {
        'tinggi': '1. Ada Overlap dengan Peta BRWA, ada kasus pemberitaan konflik dan belum ada bukti penyelesaian\n2. Tidak Memiliki SOP mengenai Padiatapan dan Penanganan Keluhan Stakeholder',
        'sedang': '1. Tidak ada Overlap dengan peta BRWA, Terdapat Konflik namun sudah ada proses penyelesaian\n2. Memiliki SOP mengenai Padiatapan dan Penanganan Keluhan Stakeholder',
        'rendah': '1. Tidak ada Overlap, (Jika Terdapat Kasus Konflik) Kasus sudah terselesaikan\n2. Memiliki SOP mengenai Padiatapan dan Penanganan Keluhan Stakeholder'
      }
    };
    return parameterMap[itemAnalisa]?.[tipeRisiko] || '';
  };

  // Get Non-Spatial parameter text for each risk level
  const getNonSpatialParameterText = (itemAnalisa: string, tipeRisiko: 'tinggi' | 'sedang' | 'rendah') => {
    const parameterMap: Record<string, Record<string, string>> = {
      'Lingkungan': {
        'tinggi': '1. Jika terdapat pemberitaan di media cetak/elektronik mengenai pencemaran lingkungan, perusakan ekosistem, atau pelanggaran izin lingkungan yang signifikan, Seperti : Deforestasi, Pembakaran Lahan, Limbah\n2. Tidak memiliki upaya perbaikan',
        'sedang': 'Jika terdapat pemberitaan di media cetak/elektronik mengenai dugaan pelanggaran lingkungan, namun telah melakukan upaya perbaikan.',
        'rendah': '1. Terdapat Isu Media, Namun Isu Sudah Terselesaikan\n2. Tidak terdapat pemberitaan negatif di media cetak/elektronik terkait pelanggaran lingkungan.'
      },
      'Keanekaragaman Hayati': {
        'tinggi': '1. Terdapat Konflik Satwa RTE (Rare, Threatened, and Endangered)\n2. Tidak Memiliki SOP Penanganan Konflik Satwa',
        'sedang': '1. Terdapat Konflik Satwa RTE (Rare, Threatened, and Endangered)\n2. Perusahaan Memiliki Prosedur/Mekanisme Penanganan',
        'rendah': '1. Tidak Terdapat Konflik Satwa RTE (Rare, Threatened, and Endangered)\n2. Perusahaan Memiliki Prosedur/Mekanisme Penanganan'
      },
      'Hak Pihak Ke 3 termasuk Hak-Hak Masyarakat adat (Pengelolaan Plasma dan FPIC)': {
        'tinggi': '1. Jika terdapat pemberitaan di media cetak/elektronik tentang konflik lahan dengan masyarakat adat atau petani plasma, termasuk pelanggaran prinsip FPIC (Free, Prior, Informed Consent)\n2. Tidak Memiliki SOP mengenai Padiatapan dan Penanganan Keluhan Stakeholder',
        'sedang': '1. Jika terdapat pemberitaan di media cetak/elektronik tentang konflik lahan dengan masyarakat adat atau petani plasma, namun sedang dalam proses penyelesaian/mediasi\n2. Memiliki SOP mengenai Padiatapan dan Penanganan Keluhan Stakeholder',
        'rendah': '1. Tidak terdapat pemberitaan negatif di media cetak/elektronik terkait konflik dengan masyarakat adat atau petani plasma\n2. Memiliki SOP mengenai Padiatapan dan Penanganan Keluhan Stakeholder'
      },
      'Hak Buruh dan Hak Asasi Manusia': {
        'tinggi': '1. Jika Terdapat Pemberitaan Baik Media Cetak Maupun Media Elektronik Seperti : Terdapat Pelanggaran HAM/buruh (kerja paksa, intimidasi, kekerasan)\n2. Tidak Memiliki Sistem Penanganan Keluhan Karyawan',
        'sedang': '1. Jika Terdapat Pemberitaan Baik Media Cetak Maupun Media Elektronik Seperti : Terdapat Pelanggaran HAM/buruh (kerja paksa, intimidasi, kekerasan) namun sedang dalam proses mediasi/penyelesaian\n2. Memiliki Mekanisme/Sistem Penanganan Keluhan Karyawan',
        'rendah': '1. Tidak Terdapat Pemberitaan Baik Media Cetak Maupun Media Elektronik tentang Pelanggaran HAM / Buruh\n2. Terdapat Pemberitaan namun sudah diselesaikan\n3. Memiliki Mekanisme/Sistem Penanganan Keluhan Karyawan'
      },
      'Perpajakan, Antikorupsi, perdagangan dan Bea Cukai': {
        'tinggi': 'Jika Terdapat Release dari Pemerintah/Instansi Terkait, Mengenai : 1. Penggelapan Pajak 2. Kasus Korupsi dan Suap',
        'rendah': 'Jika Tidak Terdapat Pemberitaan di Media Baik Cetak Maupun Elektronik'
      }
    };
    return parameterMap[itemAnalisa]?.[tipeRisiko] || '';
  };

  // Get Non-Spatial mitigation text for each risk level
  const getNonSpatialMitigasiText = (itemAnalisa: string, tipeRisiko: 'tinggi' | 'sedang' | 'rendah') => {
    const mitigasiMap: Record<string, Record<string, string>> = {
      'Lingkungan': {
        'tinggi': '1. Sosialisasi Kebijakan Perusahaan\n2. Melakukan gap analisis dan pendampingan untuk pemenuhan persyaratan yang sesuai dengan regulasi lingkungan',
        'sedang': '1. Sosialisasi Kebijakan Perusahaan\n2. Monitoring tindak lanjut perbaikan',
        'rendah': 'Monitoring berkala terkait isu lingkungan di media'
      },
      'Keanekaragaman Hayati': {
        'tinggi': 'Mendorong Supplier membentuk Sistem Penanganan Konflik Satwa Liar termasuk laporan penangannya',
        'sedang': 'Mendorong Supplier untuk mengaplikasikan sistem penanganan konflik satwa liar.',
        'rendah': 'Monitoring Konflik dari Pemberitaan Media'
      },
      'Hak Pihak Ke 3 termasuk Hak-Hak Masyarakat adat (Pengelolaan Plasma dan FPIC)': {
        'tinggi': 'Melakukan Pendampingan/pelibatan supplier, dalam upaya penyelesaian konflik',
        'sedang': '1. Mendorong percepatan proses resolusi konflik melalui mekanisme mediasi terbuka\n2. Sosialisasi kebijakan perusahaan kepada supplier',
        'rendah': 'Monitoring isu sosial secara berkala untuk deteksi dini potensi konflik baru.'
      },
      'Hak Buruh dan Hak Asasi Manusia': {
        'tinggi': 'Melakukan Pendampingan/pelibatan supplier, dalam upaya penyelesaian konflik',
        'sedang': '1. Mendorong percepatan proses resolusi konflik melalui mekanisme mediasi terbuka\n2. Sosialisasi kebijakan perusahaan kepada supplier',
        'rendah': 'Monitoring isu sosial secara berkala untuk deteksi dini pelanggaran terhadap hak buruh dan hak asasi manusia'
      },
      'Perpajakan, Antikorupsi, perdagangan dan Bea Cukai': {
        'tinggi': 'Di Keluarkan dari Rantai Pasok',
        'rendah': ''
      }
    };
    return mitigasiMap[itemAnalisa]?.[tipeRisiko] || '';
  };

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
                Risk Analysis
              </h1>
              <h2 className="text-xl font-semibold text-gray-800 mt-2">
                Supplier Risk Assessment and Mitigation Planning
              </h2>
              <p className="text-gray-600 mt-1">
                Comprehensive spatial and non-spatial risk evaluation for supply chain compliance
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Assessment conducted before supplier partnership agreements are implemented
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
                  disabled={createRiskAssessmentMutation.isPending}
                  data-testid="button-submit-assessment"
                >
                  {createRiskAssessmentMutation.isPending ? "Menyimpan..." : "Simpan Risk Analysis"}
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

        {/* Non-Spatial Risk Assessment - Media Coverage Analysis */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              II. Analisa Non Spasial (Pemberitaan Media)
            </CardTitle>
            <CardDescription>
              Hanya untuk Referensi Untuk Supplier Engagement
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
                    <TableHead className="w-96">Mitigasi</TableHead>
                    <TableHead className="w-32">Sumber</TableHead>
                    <TableHead className="w-32">Link Sumber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonSpatialRiskItems.map((item, index) => (
                    <TableRow key={index} className="border-b">
                      <TableCell className="font-medium">{item.no}</TableCell>
                      <TableCell className="font-semibold">{item.itemAnalisa}</TableCell>
                      <TableCell>
                        <Select 
                          value={item.tipeRisiko} 
                          onValueChange={(value) => {
                            updateNonSpatialRiskItem(index, 'tipeRisiko', value);
                          }}
                          data-testid={`select-nonspatial-risk-type-${index}`}
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
                          {getNonSpatialParameterText(item.itemAnalisa, item.tipeRisiko)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm whitespace-pre-wrap">
                          {getNonSpatialMitigasiText(item.itemAnalisa, item.tipeRisiko)}
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
            
            {/* Note for Non-Spatial Analysis */}
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800">Catatan Penting</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Analisa Non Spasial (Pemberitaan Media) ini hanya digunakan sebagai referensi untuk supplier engagement dan tidak mempengaruhi perhitungan skor risiko utama. Informasi ini membantu dalam memahami konteks media dan reputasi supplier untuk strategi pendampingan yang lebih efektif.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mitigation Plans Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              III. Risk Mitigation Plans
            </CardTitle>
            <CardDescription>
              Comprehensive mitigation strategies based on identified risk levels for both spatial and non-spatial analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              
              {/* Spatial Risk Mitigation */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Spatial Risk Mitigation Strategies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {spatialRiskItems.map((item, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{item.itemAnalisa}</CardTitle>
                          <Badge className={getRiskBadgeColor(item.tipeRisiko)}>
                            {item.tipeRisiko.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {getMitigasiText(item.itemAnalisa, item.tipeRisiko)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Non-Spatial Risk Mitigation */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Non-Spatial Risk Mitigation Strategies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nonSpatialRiskItems.map((item, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{item.itemAnalisa}</CardTitle>
                          <Badge className={getRiskBadgeColor(item.tipeRisiko)}>
                            {item.tipeRisiko.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {getNonSpatialMitigasiText(item.itemAnalisa, item.tipeRisiko)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Overall Risk Summary and Recommendations */}
              <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-2">Overall Risk Assessment Summary</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center justify-between">
                        <span>Overall Risk Classification:</span>
                        <Badge className={`${getRiskBadgeColor(riskClassification)} text-sm px-3 py-1`}>
                          {riskClassification.toUpperCase()} RISK
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Risk Score:</span>
                        <span className="font-bold">{totalScore}%</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-blue-300">
                        <h5 className="font-medium mb-2">Next Steps:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {riskClassification === 'tinggi' && (
                            <>
                              <li>Immediate attention required for all high-risk items</li>
                              <li>Consider exclusion from supply chain for critical violations</li>
                              <li>Implement intensive supplier support and monitoring</li>
                            </>
                          )}
                          {riskClassification === 'sedang' && (
                            <>
                              <li>Enhanced monitoring and support programs required</li>
                              <li>Develop improvement timeline with supplier</li>
                              <li>Regular progress assessments recommended</li>
                            </>
                          )}
                          {riskClassification === 'rendah' && (
                            <>
                              <li>Continue standard monitoring procedures</li>
                              <li>Maintain current supplier relationship</li>
                              <li>Annual reassessment recommended</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}