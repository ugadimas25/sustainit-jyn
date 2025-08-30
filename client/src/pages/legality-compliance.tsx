import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Upload, Download, Eye, ChevronDown, Brain, AlertTriangle, CheckCircle, Clock, TrendingUp, HelpCircle, Shield, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import type { UploadResult } from '@uppy/core';


export default function LegalityCompliance() {
  const [activeTab, setActiveTab] = useState('supplier-compliance');
  const { toast } = useToast();
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  
  // Progress tracking
  const [complianceProgress, setComplianceProgress] = useState({
    overall: 0,
    sections: {
      landRights: 0,
      environmental: 0,
      implementation: 0,
      forestry: 0,
      thirdParty: 0,
      cooperation: 0,
      information: 0,
      humanRights: 0,
      labor: 0,
      antiCorruption: 0,
      taxation: 0
    }
  });

  // Supplier compliance form state - moved here to avoid initialization error
  const [supplierComplianceForm, setSupplierComplianceForm] = useState({
    // Basic Information
    namaSupplier: '',
    namaGroup: '',
    aktaPendirianPerusahaan: '',
    aktaPerubahan: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    alamatKantor: '',
    alamatKebun: '',
    koordinatKebun: '',
    koordinatKantor: '',
    jenisSupplier: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // 3.1 Hak Penggunaan Tanah
    historisPerolehanTanah: '',
    historisKeterangan: '',
    izinPencadangan: '',
    izinPencadanganLahan: '',
    izinPencadanganKeterangan: '',
    persetujuanPKKPR: '',
    persetujuanPKKPRKeterangan: '',
    izinUsahaPerkebunan: '',
    izinUsahaPerkebunanKeterangan: '',
    skHGU: '',
    skHGUKeterangan: '',
    sertifikatHGU: '',
    sertifikatHGUKeterangan: '',
    laporanPemanfaatanHGU: '',
    laporanPemanfaatanHGUKeterangan: '',
    laporanLPUP: '',
    laporanLPUPKeterangan: '',
    
    // 3.2 Perlindungan Lingkungan Hidup
    izinLingkungan: '',
    izinLingkunganKeterangan: '',
    izinRintekTPS: '',
    izinRintekTPSKeterangan: '',
    izinLimbahCair: '',
    izinLimbahCairKeterangan: '',
    izinPertekLimbah: '',
    izinPertekLimbahKeterangan: '',
    persetujuanAndalalin: '',
    persetujuanAndalalinKeterangan: '',
    daftarPestisida: '',
    daftarPestisidaKeterangan: '',
    
    // 3.3 Bukti Pelaksanaan
    buktiPelaksanaan: '',
    buktiPelaksanaanII: '',
    buktiPelaksanaanKeterangan: '',
    laporanRKLRPL: '',
    laporanRKLRPLKeterangan: '',
    laporanPestisida: '',
    laporanPestisidaKeterangan: '',
    
    // 3.4 Peraturan Kehutanan
    peraturanKehutanan: '',
    peraturanKehutananKeterangan: '',
    areaSesuaiPeruntukan: '',
    areaSesuaiPeruntukanKeterangan: '',
    skPelepasanHutan: '',
    skPelepasanHutanKeterangan: '',
    dokumenInstansiRelevant: '',
    dokumenInstansiRelevanKeterangan: '',
    
    // 3.5 Hak Pihak Ketiga dan Masyarakat Adat
    hakPihakKetiga: '',
    hakPihakKetigaKeterangan: '',
    kebijakanHakPihakKetiga: '',
    kebijakanHakPihakKetigaKeterangan: '',
    kebijakanPerusahaan: '',
    kebijakanPerusahaanKeterangan: '',
    sopGRTT: '',
    sopGRTTKeterangan: '',
    sopPADIATAPA: '',
    sopPADIATAPAKeterangan: '',
    sopPermintaanInformasi: '',
    sopPermintaanInformasiKeterangan: '',
    sopKeluhanStakeholder: '',
    sopKeluhanStakeholderKeterangan: '',
    
    // 3.6 Kewajiban Pengembangan Plasma
    mouKerjasama: '',
    mouKerjasamaKeterangan: '',
    mouKerjaSama: '',
    mouKerjaSamaKeterangan: '',
    skCPCL: '',
    skCPCLKeterangan: '',
    laporanRealisasiPlasma: '',
    laporanRealisasiPlasmaKeterangan: '',
    
    // 3.7 Bukti Implementasi
    suratMasukInformasi: '',
    suratMasukInformasiKeterangan: '',
    suratKeluarInformasi: '',
    suratKeluarInformasiKeterangan: '',
    buktiGRTT: '',
    buktiGRTTKeterangan: '',
    buktiFPIC: '',
    buktiFPICKeterangan: '',
    suratMasukPermintaan: '',
    suratMasukPermintaanKeterangan: '',
    suratKeluarPermintaan: '',
    suratKeluarPermintaanKeterangan: '',
    suratMasukKeluhan: '',
    suratMasukKeluhanKeterangan: '',
    suratKeluarKeluhan: '',
    suratKeluarKeluhanKeterangan: '',
    
    // 3.8 Sengketa Lahan
    laporanSengketaLahan: '',
    laporanSengketaLahanKeterangan: '',
    
    // 3.9 Hak Buruh dan HAM
    kebijakanHAM: '',
    kebijakanHAMKeterangan: '',
    komitmenHakBuruh: '',
    kebijakanHakBuruh: '',
    kebijakanHakBuruhKeterangan: '',
    sopKetenagakerjaan: '',
    sopKetenagakerjaanKeterangan: '',
    sopK3: '',
    sopK3Keterangan: '',
    
    // 3.10 Bukti Pelaksanaan HAM
    buktiDisnaker: '',
    buktiDisnakerKeterangan: '',
    buktiPerjanjianKerja: '',
    buktiPerjanjianKerjaKeterangan: '',
    daftarKaryawan: '',
    daftarKaryawanKeterangan: '',
    skUMR: '',
    skUMRKeterangan: '',
    skSerikatPekerja: '',
    skSerikatPekerjaKeterangan: '',
    buktiBPJS: '',
    buktiBPJSKeterangan: '',
    laporanP2K3: '',
    laporanP2K3Keterangan: '',
    
    // 3.11 Perpajakan dan Antikorupsi
    kebijakanPerpajakan: '',
    kebijakanPerpajakanKeterangan: '',
    sopKodeEtikBisnis: '',
    sopKodeEtikBisnisKeterangan: '',
    komitmenAntikorupsi: '',
    kebijakanAntikorupsi: '',
    kebijakanAntikorupsiKeterangan: '',
    sopKodeEtik: '',
    sopKodeEtikKeterangan: '',
    saluranPengaduan: '',
    saluranPengaduanKeterangan: '',
    
    // 3.12 Bukti Pajak dan Ekspor
    suratTerdaftarPajak: '',
    suratTerdaftarPajakKeterangan: '',
    suratTerdaftarPajakStatus: '',
    npwp: '',
    npwpKeterangan: '',
    npwpStatus: '',
    
    // Status fields for conditional rendering
    izinPencadanganStatus: '',
    persetujuanPKKPRStatus: '',
    izinUsahaPerkebunanStatus: '',
    izinRintekTPSStatus: '',
    izinLimbahCairStatus: '',
    persetujuanAndalalinStatus: '',
  });

  // Helper functions for progress calculation
  const calculateSectionProgress = (fields: string[], formData: any) => {
    const totalFields = fields.length;
    const completedFields = fields.filter(field => 
      formData[field as keyof typeof formData] !== ''
    ).length;
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  };

  const calculateOverallProgress = (formData: any) => {
    const sectionFields = {
      landRights: ['historisPerolehanTanah', 'izinPencadangan', 'persetujuanPKKPR', 'izinUsahaPerkebunan', 'skHGU'],
      environmental: ['izinLingkungan', 'izinRintekTPS', 'izinLimbahCair', 'persetujuanAndalalin', 'daftarPestisida'],
      implementation: ['buktiPelaksanaan', 'laporanRKLRPL', 'laporanPestisida'],
      forestry: ['areaSesuaiPeruntukan', 'skPelepasanHutan', 'dokumenInstansiRelevant'],
      thirdParty: ['kebijakanHakPihakKetiga', 'kebijakanPerusahaan', 'sopGRTT'],
      cooperation: ['mouKerjaSama', 'skCPCL', 'laporanRealisasiPlasma'],
      information: ['suratMasukPermintaan', 'suratKeluarPermintaan', 'suratMasukKeluhan'],
      humanRights: ['komitmenHakBuruh', 'kebijakanHakBuruh', 'sopKetenagakerjaan'],
      labor: ['daftarKaryawan', 'skUMR', 'skSerikatPekerja', 'buktiBPJS', 'laporanP2K3'],
      antiCorruption: ['komitmenAntikorupsi', 'kebijakanAntikorupsi', 'sopKodeEtik', 'saluranPengaduan'],
      taxation: ['suratTerdaftarPajak', 'npwp']
    };

    const sectionProgress: {
      landRights: number;
      environmental: number;
      implementation: number;
      forestry: number;
      thirdParty: number;
      cooperation: number;
      information: number;
      humanRights: number;
      labor: number;
      antiCorruption: number;
      taxation: number;
    } = {
      landRights: 0,
      environmental: 0,
      implementation: 0,
      forestry: 0,
      thirdParty: 0,
      cooperation: 0,
      information: 0,
      humanRights: 0,
      labor: 0,
      antiCorruption: 0,
      taxation: 0
    };
    let totalProgress = 0;
    
    Object.entries(sectionFields).forEach(([section, fields]) => {
      const progress = calculateSectionProgress(fields, formData);
      sectionProgress[section as keyof typeof sectionProgress] = progress;
      totalProgress += progress;
    });

    return {
      overall: totalProgress / Object.keys(sectionFields).length,
      sections: sectionProgress
    };
  };

  // Export functions
  const exportToPDF = () => {
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(18);
    pdf.text('EUDR Compliance Report', 20, 30);
    
    // Add supplier info
    pdf.setFontSize(12);
    pdf.text(`Supplier: ${supplierComplianceForm.namaSupplier}`, 20, 50);
    pdf.text(`Group: ${supplierComplianceForm.namaGroup}`, 20, 65);
    pdf.text(`Overall Compliance: ${complianceProgress.overall.toFixed(1)}%`, 20, 80);
    
    // Add sections progress
    let yPos = 100;
    Object.entries(complianceProgress.sections).forEach(([section, progress]) => {
      pdf.text(`${section}: ${progress.toFixed(1)}%`, 30, yPos);
      yPos += 15;
    });
    
    pdf.save(`compliance-report-${supplierComplianceForm.namaSupplier}.pdf`);
    
    toast({
      title: "Report exported successfully",
      description: "Compliance report has been saved as PDF",
    });
  };

  const exportToInteractiveDashboard = () => {
    const dashboardData = {
      supplier: supplierComplianceForm.namaSupplier,
      progress: complianceProgress,
      timestamp: new Date().toISOString(),
      formData: supplierComplianceForm
    };
    
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `compliance-dashboard-${supplierComplianceForm.namaSupplier}.json`;
    link.click();
    
    toast({
      title: "Dashboard data exported",
      description: "Interactive dashboard data has been downloaded",
    });
  };

  // AI-powered risk assessment data
  const riskAssessments = {
    landRights: {
      risk: "HIGH",
      insight: "Land rights documentation is critical for EUDR compliance. Missing permits can lead to immediate non-compliance.",
      requirements: ["Valid land use permits", "Clear ownership documentation", "Updated cadastral data"],
      commonIssues: ["Expired permits", "Overlapping claims", "Indigenous land conflicts"]
    },
    environmental: {
      risk: "MEDIUM",
      insight: "Environmental permits ensure sustainable operations. Regular monitoring prevents violations.",
      requirements: ["Environmental impact assessments", "Waste management permits", "Water usage licenses"],
      commonIssues: ["Outdated assessments", "Permit renewals", "Monitoring gaps"]
    },
    implementation: {
      risk: "LOW",
      insight: "Implementation evidence demonstrates active compliance management.",
      requirements: ["Implementation reports", "Monitoring records", "Action plans"],
      commonIssues: ["Incomplete documentation", "Missing follow-ups", "Unclear responsibilities"]
    },
    forestry: {
      risk: "HIGH", 
      insight: "Forest regulations are core to EUDR. Non-compliance can result in product bans.",
      requirements: ["Forest permits", "Deforestation monitoring", "Conservation plans"],
      commonIssues: ["Permit violations", "Unregistered activities", "Boundary disputes"]
    }
  };

  // Document validation functions
  const validateDocument = (file: any) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed.' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit.' };
    }
    
    return { valid: true, error: null };
  };

  // Update progress when form changes
  useEffect(() => {
    const newProgress = calculateOverallProgress(supplierComplianceForm);
    setComplianceProgress(newProgress);
  }, [supplierComplianceForm]);

  // Fetch data from Data Collection forms for suggestions
  const { data: estateData = [] } = useQuery({
    queryKey: ['/api', 'estate-data-collection'],
  });

  const { data: millData = [] } = useQuery({
    queryKey: ['/api', 'mill-data-collection'],
  });

  const { data: traceabilityData = [] } = useQuery({
    queryKey: ['/api', 'traceability-data-collection'],
  });

  const { data: kcpData = [] } = useQuery({
    queryKey: ['/api', 'kcp-data-collection'],
  });

  const { data: bulkingData = [] } = useQuery({
    queryKey: ['/api', 'bulking-data-collection'],
  });

  // Fetch supplier compliance data
  const { data: supplierComplianceData = [] } = useQuery<any[]>({
    queryKey: ['/api/supplier-compliance'],
  });

  // Helper functions to extract suggestions from data collection forms
  const getSupplierSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    // Get supplier names from estate data
    if (Array.isArray(estateData)) {
      estateData.forEach((estate: any) => {
        if (estate?.supplierName) suggestions.push(estate.supplierName);
        if (estate?.groupName) suggestions.push(estate.groupName);
        if (estate?.companyName) suggestions.push(estate.companyName);
      });
    }
    
    // Get supplier names from mill data
    if (Array.isArray(millData)) {
      millData.forEach((mill: any) => {
        if (mill?.supplierName) suggestions.push(mill.supplierName);
        if (mill?.companyName) suggestions.push(mill.companyName);
      });
    }
    
    // Get supplier names from traceability data
    if (Array.isArray(traceabilityData)) {
      traceabilityData.forEach((traceability: any) => {
        if (traceability?.supplierName) suggestions.push(traceability.supplierName);
        if (traceability?.companyName) suggestions.push(traceability.companyName);
      });
    }
    
    return Array.from(new Set(suggestions.filter(Boolean)));
  };

  const getAddressSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    // Get addresses from all forms
    const allData = [
      ...(Array.isArray(estateData) ? estateData : []),
      ...(Array.isArray(millData) ? millData : []),
      ...(Array.isArray(traceabilityData) ? traceabilityData : []),
      ...(Array.isArray(kcpData) ? kcpData : []),
      ...(Array.isArray(bulkingData) ? bulkingData : [])
    ];
    
    allData.forEach((item: any) => {
      if (item?.officeAddress) suggestions.push(item.officeAddress);
      if (item?.facilityAddress) suggestions.push(item.facilityAddress);
      if (item?.address) suggestions.push(item.address);
      if (item?.estateAddress) suggestions.push(item.estateAddress);
      if (item?.location) suggestions.push(item.location);
    });
    
    return Array.from(new Set(suggestions.filter(Boolean)));
  };

  const getCoordinateSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    const allData = [
      ...(Array.isArray(estateData) ? estateData : []),
      ...(Array.isArray(millData) ? millData : []),
      ...(Array.isArray(traceabilityData) ? traceabilityData : []),
      ...(Array.isArray(kcpData) ? kcpData : []),
      ...(Array.isArray(bulkingData) ? bulkingData : [])
    ];
    
    allData.forEach((item: any) => {
      if (item?.coordinates) suggestions.push(item.coordinates);
      if (item?.gpsCoordinates) suggestions.push(item.gpsCoordinates);
      if (item?.latitude && item?.longitude) {
        suggestions.push(`${item.latitude}, ${item.longitude}`);
      }
    });
    
    return Array.from(new Set(suggestions.filter(Boolean)));
  };

  const getContactPersonSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    const allData = [
      ...(Array.isArray(estateData) ? estateData : []),
      ...(Array.isArray(millData) ? millData : []),
      ...(Array.isArray(traceabilityData) ? traceabilityData : []),
      ...(Array.isArray(kcpData) ? kcpData : []),
      ...(Array.isArray(bulkingData) ? bulkingData : [])
    ];
    
    allData.forEach((item: any) => {
      if (item?.contactPersonName) suggestions.push(item.contactPersonName);
      if (item?.responsiblePerson) suggestions.push(item.responsiblePerson);
      if (item?.managerName) suggestions.push(item.managerName);
      if (item?.personInCharge) suggestions.push(item.personInCharge);
    });
    
    return Array.from(new Set(suggestions.filter(Boolean)));
  };

  // AutocompleteInput component
  const AutocompleteInput = ({ 
    value, 
    onChange, 
    suggestions, 
    placeholder, 
    className,
    ...props 
  }: {
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    className?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value) {
        const filtered = suggestions.filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
      } else {
        setFilteredSuggestions(suggestions);
      }
    }, [value, suggestions]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          !inputRef.current?.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className={className}
            {...props}
          />
          {suggestions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:bg-transparent"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          )}
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                onClick={() => {
                  onChange(suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
        {showSuggestions && filteredSuggestions.length === 0 && value && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
          >
            <div className="px-3 py-2 text-sm text-gray-500">
              Tidak ada saran yang ditemukan
            </div>
          </div>
        )}
      </div>
    );
  };

  const createSupplierComplianceMutation = useMutation({
    mutationFn: async (data: any) => {
      // First save the data
      const saveResponse = await apiRequest('POST', '/api/supplier-compliance', data) as any;
      
      // Then analyze it with AI
      const analysisResponse = await apiRequest('POST', `/api/supplier-compliance/${saveResponse.id}/analyze`, {
        formData: data,
        supplierName: data.namaSupplier
      }) as any;
      
      return { saveResponse, analysisResponse };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier-compliance'] });
      
      // Store analysis results
      if (result.analysisResponse?.analysis) {
        setAnalysisResults(prev => [...prev, result.analysisResponse]);
      }
      
      // Mark form as submitted to show progress tracker
      setIsFormSubmitted(true);
      
      toast({
        title: "Data Supplier Compliance berhasil disimpan dan dianalisis",
        description: "Data telah disimpan dan analisis AI telah selesai.",
      });
      setActiveTab('results');
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan data",
        description: error.message || "Terjadi kesalahan saat menyimpan data supplier compliance.",
        variant: "destructive",
      });
    },
  });

  // Mutation for analyzing individual supplier
  const analyzeSupplierMutation = useMutation({
    mutationFn: ({ supplierId, formData, supplierName }: { supplierId: string, formData: any, supplierName: string }) => 
      apiRequest('POST', `/api/supplier-compliance/${supplierId}/analyze`, { formData, supplierName }) as Promise<any>,
    onSuccess: (result: any) => {
      setAnalysisResults(prev => [...prev.filter(r => r.supplierId !== result.supplierId), result]);
      toast({
        title: "Analisis AI selesai",
        description: `Analisis kepatuhan untuk ${result?.supplierName || 'supplier'} telah selesai.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menganalisis",
        description: error.message || "Terjadi kesalahan saat menganalisis supplier.",
        variant: "destructive",
      });
    },
  });

  const handleSupplierComplianceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplierComplianceMutation.mutate(supplierComplianceForm);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects${uploadURL.split('/uploads')[1]}` : uploadURL;
      
      setSupplierComplianceForm(prev => ({ ...prev, [fieldName]: objectPath }));
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen untuk ${fieldName} telah berhasil diunggah.`,
      });
    }
  };

  // Dummy data for results table
  const dummySupplierComplianceData = [
    {
      id: 1,
      namaSupplier: 'PT Kebun Kelapa Sawit Sejahtera',
      tingkatKepatuhan: 85,
      statusKepatuhan: 'Compliant',
      tanggalPenilaian: '15 November 2024',
      nomorTelefonTimInternal: '+62 811-2345-6789',
      emailKontak: 'compliance@kebun-sejahtera.co.id'
    },
    {
      id: 2,
      namaSupplier: 'CV Perkebunan Nusantara',
      tingkatKepatuhan: 92,
      statusKepatuhan: 'Highly Compliant',
      tanggalPenilaian: '18 November 2024',
      nomorTelefonTimInternal: '+62 812-3456-7890',
      emailKontak: 'legal@perkebunan-nusantara.co.id'
    },
    {
      id: 3,
      namaSupplier: 'Koperasi Tani Mandiri',
      tingkatKepatuhan: 68,
      statusKepatuhan: 'Partially Compliant',
      tanggalPenilaian: '20 November 2024',
      nomorTeleponTimInternal: '+62 813-4567-8901',
      emailKontak: 'koperasi@tani-mandiri.co.id'
    }
  ];

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Legality Compliance</h1>
          <p className="text-gray-600">
            Sistem penilaian kepatuhan hukum supplier untuk memastikan compliance dengan regulasi EUDR
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supplier-compliance" data-testid="tab-supplier-compliance">Supplier Compliance</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Hasil Penilaian</TabsTrigger>
          </TabsList>

          {/* Supplier Compliance Tab */}
          <TabsContent value="supplier-compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formulir Informasi Kepatuhan Hukum</CardTitle>
                <CardDescription>
                  (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
                </CardDescription>
              </CardHeader>
              
              {/* Interactive Compliance Progress Tracker - Only show after form submission */}
              {isFormSubmitted && (
                <div className="px-6 pb-4">
                <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Compliance Progress Tracker</CardTitle>
                          <CardDescription>Interactive scoring with real-time validation</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {complianceProgress.overall.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Overall Score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-gray-500">{complianceProgress.overall.toFixed(1)}%</span>
                      </div>
                      <Progress value={complianceProgress.overall} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(complianceProgress.sections).map(([section, progress]) => (
                        <div key={section} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            progress >= 80 ? 'bg-green-500' : 
                            progress >= 60 ? 'bg-yellow-500' : 
                            progress >= 40 ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-gray-600 capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-xs font-medium ml-auto">{progress.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Document Validation Status Panel */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Document Integrity Status</span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Real-time Validation
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-700">Documents Uploaded</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">0/11</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs text-gray-700">Validation Pending</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">0</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-gray-700">Validation Failed</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">0</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-700">Processing</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">0</span>
                        </div>
                      </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={exportToPDF}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </Button>
                      <Button
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={exportToInteractiveDashboard}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}

              <CardContent>
                <form onSubmit={handleSupplierComplianceSubmit} className="space-y-8">
                  {/* Basic Information Section - Exact format from document */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Nama Supplier :</Label>
                        <AutocompleteInput
                          value={supplierComplianceForm.namaSupplier}
                          onChange={(value: string) => setSupplierComplianceForm(prev => ({ ...prev, namaSupplier: value }))}
                          suggestions={getSupplierSuggestions()}
                          placeholder="Pilih dari data yang tersedia atau ketik manual"
                          data-testid="input-nama-supplier"
                        />
                        {getSupplierSuggestions().length > 0 && (
                          <div className="text-xs text-blue-600">
                            💡 {getSupplierSuggestions().length} saran tersedia dari data collection
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Nama Group / Parent Company Name :</Label>
                        <AutocompleteInput
                          value={supplierComplianceForm.namaGroup}
                          onChange={(value: string) => setSupplierComplianceForm(prev => ({ ...prev, namaGroup: value }))}
                          suggestions={getSupplierSuggestions()}
                          placeholder="Pilih dari data yang tersedia atau ketik manual"
                          data-testid="input-nama-group"
                        />
                        {getSupplierSuggestions().length > 0 && (
                          <div className="text-xs text-blue-600">
                            💡 {getSupplierSuggestions().length} saran tersedia dari data collection
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Akta Pendirian Perusahaan :</Label>
                        <Input
                          value={supplierComplianceForm.aktaPendirianPerusahaan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPendirianPerusahaan: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Akta Perubahan (Jika Ada) :</Label>
                        <Input
                          value={supplierComplianceForm.aktaPerubahan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPerubahan: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Izin Berusaha (Nomor Induk Berusaha) :</Label>
                        <Input
                          value={supplierComplianceForm.izinBerusaha}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Tipe Sertifikat Yang Dimiliki Perusahaan :</Label>
                        <Input
                          value={supplierComplianceForm.tipeSertifikat}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, tipeSertifikat: e.target.value }))}
                          placeholder="(ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3)"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Alamat</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Kantor :</Label>
                          <Textarea
                            value={supplierComplianceForm.alamatKantor}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                            rows={3}
                            placeholder="Pilih dari saran yang tersedia atau ketik manual"
                            data-testid="textarea-alamat-kantor"
                          />
                          {getAddressSuggestions().length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-blue-600">💡 Saran alamat:</span>
                              {getAddressSuggestions().slice(0, 3).map((addr, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                                  onClick={() => setSupplierComplianceForm(prev => ({ ...prev, alamatKantor: addr }))}
                                >
                                  {addr.length > 30 ? addr.substring(0, 30) + '...' : addr}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Kebun :</Label>
                          <Textarea
                            value={supplierComplianceForm.alamatKebun}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                            rows={3}
                            placeholder="Pilih dari saran yang tersedia atau ketik manual"
                            data-testid="textarea-alamat-kebun"
                          />
                          {getAddressSuggestions().length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-blue-600">💡 Saran alamat:</span>
                              {getAddressSuggestions().slice(0, 3).map((addr, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                                  onClick={() => setSupplierComplianceForm(prev => ({ ...prev, alamatKebun: addr }))}
                                >
                                  {addr.length > 30 ? addr.substring(0, 30) + '...' : addr}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Koordinat</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Kebun :</Label>
                          <AutocompleteInput
                            value={supplierComplianceForm.koordinatKebun}
                            onChange={(value: string) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKebun: value }))}
                            suggestions={getCoordinateSuggestions()}
                            placeholder="Format: latitude, longitude atau pilih dari saran"
                            data-testid="input-koordinat-kebun"
                          />
                          {getCoordinateSuggestions().length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 {getCoordinateSuggestions().length} koordinat tersedia dari data collection
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Kantor :</Label>
                          <AutocompleteInput
                            value={supplierComplianceForm.koordinatKantor}
                            onChange={(value: string) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKantor: value }))}
                            suggestions={getCoordinateSuggestions()}
                            placeholder="Format: latitude, longitude atau pilih dari saran"
                            data-testid="input-koordinat-kantor"
                          />
                          {getCoordinateSuggestions().length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 {getCoordinateSuggestions().length} koordinat tersedia dari data collection
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium">Jenis supplier :</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="kkpa"
                            name="jenisSupplier"
                            value="kkpa"
                            checked={supplierComplianceForm.jenisSupplier === 'kkpa'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="kkpa">Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="sister"
                            name="jenisSupplier"
                            value="sister"
                            checked={supplierComplianceForm.jenisSupplier === 'sister'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="sister">Kebun dalam satu grup manajemen (sister company)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="third-party"
                            name="jenisSupplier"
                            value="third-party"
                            checked={supplierComplianceForm.jenisSupplier === 'third-party'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="third-party">Kebun pihak ketiga (PT/ CV/ Koperasi)</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Penanggung Jawab</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Nama :</Label>
                          <AutocompleteInput
                            value={supplierComplianceForm.namaPenanggungJawab}
                            onChange={(value: string) => setSupplierComplianceForm(prev => ({ ...prev, namaPenanggungJawab: value }))}
                            suggestions={getContactPersonSuggestions()}
                            placeholder="Pilih dari data yang tersedia atau ketik manual"
                            data-testid="input-nama-penanggung-jawab"
                          />
                          {getContactPersonSuggestions().length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 {getContactPersonSuggestions().length} kontak tersedia dari data collection
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Jabatan :</Label>
                          <Input
                            value={supplierComplianceForm.jabatanPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                            data-testid="input-jabatan-penanggung-jawab"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Email :</Label>
                          <Input
                            type="email"
                            value={supplierComplianceForm.emailPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Nomor Telfon / Handphone :</Label>
                          <Input
                            value={supplierComplianceForm.nomorTelefonPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Nama :</Label>
                          <AutocompleteInput
                            value={supplierComplianceForm.namaTimInternal}
                            onChange={(value: string) => setSupplierComplianceForm(prev => ({ ...prev, namaTimInternal: value }))}
                            suggestions={getContactPersonSuggestions()}
                            placeholder="Pilih dari data yang tersedia atau ketik manual"
                            data-testid="input-nama-tim-internal"
                          />
                          {getContactPersonSuggestions().length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 {getContactPersonSuggestions().length} kontak tersedia dari data collection
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Jabatan :</Label>
                          <Input
                            value={supplierComplianceForm.jabatanTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                            data-testid="input-jabatan-tim-internal"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Email :</Label>
                          <Input
                            type="email"
                            value={supplierComplianceForm.emailTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Nomor Telfon / Handphone :</Label>
                          <Input
                            value={supplierComplianceForm.nomorTeleponTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Legal Compliance Section */}
                  <div className="space-y-8">
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-xl font-bold text-blue-800">Legal Compliance</h3>
                      <p className="text-sm text-blue-600 mt-2">Berlaku Untuk Perusahaan Yang Belum Sertifikasi ISPO</p>
                    </div>

                    {/* I. Hak Penggunaan Tanah */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold">I. Hak Penggunaan Tanah</h3>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                              riskAssessments.landRights.risk === 'HIGH' ? 'bg-red-100 text-red-700' :
                              riskAssessments.landRights.risk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              <AlertTriangle className="w-3 h-3" />
                              {riskAssessments.landRights.risk} RISK
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-4 space-y-3">
                            <div className="font-semibold text-blue-800">AI Risk Assessment</div>
                            <div className="text-sm text-gray-700">{riskAssessments.landRights.insight}</div>
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-600">Requirements:</div>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {riskAssessments.landRights.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-green-600 mt-0.5">•</span>
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-600">Common Issues:</div>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {riskAssessments.landRights.commonIssues.map((issue, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-red-600 mt-0.5">⚠</span>
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah Perusahaan Memiliki Historis Perolehan Tanah</Label>
                        
                        {/* a. Izin Pencadangan Lahan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Izin Pencadangan Lahan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinPencadangan-yes"
                                name="izinPencadanganLahan"
                                value="yes"
                                checked={supplierComplianceForm.izinPencadanganLahan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganLahan: e.target.value }))}
                              />
                              <Label htmlFor="izinPencadangan-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinPencadangan-no"
                                name="izinPencadanganLahan"
                                value="no"
                                checked={supplierComplianceForm.izinPencadanganLahan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganLahan: e.target.value }))}
                              />
                              <Label htmlFor="izinPencadangan-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinPencadanganKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganKeterangan: e.target.value }))}
                              rows={2}
                            />
                            {supplierComplianceForm.izinPencadangan === 'yes' ? (
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  Upload Dokumen Pendukung:
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                                        <HelpCircle className="w-3 h-3 text-blue-600" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-2 max-w-xs">
                                        <div className="font-semibold">Document Validation</div>
                                        <div className="text-xs">✓ PDF, JPEG, PNG only</div>
                                        <div className="text-xs">✓ Max 10MB per file</div>
                                        <div className="text-xs">✓ Real-time integrity check</div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'izinPencadanganDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                  maxNumberOfFiles={10}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                                <div className="flex items-center gap-2 text-xs">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-green-700">Document validation enabled</span>
                                  <Badge variant="outline" className="text-xs">
                                    Real-time check
                                  </Badge>
                                </div>
                              </div>
                            ) : supplierComplianceForm.izinPencadangan === 'no' ? (
                              <div className="space-y-2">
                                <Label>Status:</Label>
                                <Select 
                                  value={supplierComplianceForm.izinPencadanganStatus || ''} 
                                  onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tidak-ada">Tidak ada</SelectItem>
                                    <SelectItem value="dalam-proses">Dalam proses</SelectItem>
                                    <SelectItem value="tidak-relevan">Tidak relevan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* b. PKKPR / Izin Lokasi */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) / Izin Lokasi</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="pkkpr-yes"
                                name="persetujuanPKKPR"
                                value="yes"
                                checked={supplierComplianceForm.persetujuanPKKPR === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPR: e.target.value }))}
                              />
                              <Label htmlFor="pkkpr-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="pkkpr-no"
                                name="persetujuanPKKPR"
                                value="no"
                                checked={supplierComplianceForm.persetujuanPKKPR === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPR: e.target.value }))}
                              />
                              <Label htmlFor="pkkpr-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.persetujuanPKKPRKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPRKeterangan: e.target.value }))}
                              rows={2}
                            />
                            {supplierComplianceForm.persetujuanPKKPR === 'yes' ? (
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'pkkprDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                  maxNumberOfFiles={10}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            ) : supplierComplianceForm.persetujuanPKKPR === 'no' ? (
                              <div className="space-y-2">
                                <Label>Status:</Label>
                                <Select 
                                  value={supplierComplianceForm.persetujuanPKKPRStatus || ''} 
                                  onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPRStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tidak-ada">Tidak ada</SelectItem>
                                    <SelectItem value="dalam-proses">Dalam proses</SelectItem>
                                    <SelectItem value="tidak-relevan">Tidak relevan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* c. Izin Usaha Perkebunan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Izin Usaha Perkebunan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinUsaha-yes"
                                name="izinUsahaPerkebunan"
                                value="yes"
                                checked={supplierComplianceForm.izinUsahaPerkebunan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunan: e.target.value }))}
                              />
                              <Label htmlFor="izinUsaha-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinUsaha-no"
                                name="izinUsahaPerkebunan"
                                value="no"
                                checked={supplierComplianceForm.izinUsahaPerkebunan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunan: e.target.value }))}
                              />
                              <Label htmlFor="izinUsaha-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinUsahaPerkebunanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            {supplierComplianceForm.izinUsahaPerkebunan === 'yes' ? (
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'izinUsahaDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                  maxNumberOfFiles={10}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            ) : supplierComplianceForm.izinUsahaPerkebunan === 'no' ? (
                              <div className="space-y-2">
                                <Label>Status:</Label>
                                <Select 
                                  value={supplierComplianceForm.izinUsahaPerkebunanStatus || ''} 
                                  onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunanStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tidak-ada">Tidak ada</SelectItem>
                                    <SelectItem value="dalam-proses">Dalam proses</SelectItem>
                                    <SelectItem value="tidak-relevan">Tidak relevan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* d. SK HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. SK HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skHGU-yes"
                                name="skHGU"
                                value="yes"
                                checked={supplierComplianceForm.skHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGU: e.target.value }))}
                              />
                              <Label htmlFor="skHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skHGU-no"
                                name="skHGU"
                                value="no"
                                checked={supplierComplianceForm.skHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGU: e.target.value }))}
                              />
                              <Label htmlFor="skHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* e. Sertifikat HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">e. Sertifikat HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sertifikatHGU-yes"
                                name="sertifikatHGU"
                                value="yes"
                                checked={supplierComplianceForm.sertifikatHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGU: e.target.value }))}
                              />
                              <Label htmlFor="sertifikatHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sertifikatHGU-no"
                                name="sertifikatHGU"
                                value="no"
                                checked={supplierComplianceForm.sertifikatHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGU: e.target.value }))}
                              />
                              <Label htmlFor="sertifikatHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sertifikatHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sertifikatHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* f. Laporan Pemanfaatan HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">f. Laporan Pemanfaatan HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanHGU-yes"
                                name="laporanPemanfaatanHGU"
                                value="yes"
                                checked={supplierComplianceForm.laporanPemanfaatanHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGU: e.target.value }))}
                              />
                              <Label htmlFor="laporanHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanHGU-no"
                                name="laporanPemanfaatanHGU"
                                value="no"
                                checked={supplierComplianceForm.laporanPemanfaatanHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGU: e.target.value }))}
                              />
                              <Label htmlFor="laporanHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanPemanfaatanHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'laporanHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* g. Laporan Perkembangan Usaha Perkebunan (LPUP) */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">g. Laporan Perkembangan Usaha Perkebunan (LPUP)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="lpup-yes"
                                name="laporanLPUP"
                                value="yes"
                                checked={supplierComplianceForm.laporanLPUP === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUP: e.target.value }))}
                              />
                              <Label htmlFor="lpup-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="lpup-no"
                                name="laporanLPUP"
                                value="no"
                                checked={supplierComplianceForm.laporanLPUP === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUP: e.target.value }))}
                              />
                              <Label htmlFor="lpup-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanLPUPKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUPKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'lpupDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* II. Perlindungan Lingkungan Hidup */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">II. Perlindungan Lingkungan Hidup</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah Perusahaan Memiliki Perizinan Lingkungan Sesuai dengan Regulasi yang Relevan</Label>
                        
                        {/* a. Izin Lingkungan dan Dokumen Terkait */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Izin Lingkungan dan Dokumen Terkait</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLingkungan-yes"
                                name="izinLingkungan"
                                value="yes"
                                checked={supplierComplianceForm.izinLingkungan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkungan: e.target.value }))}
                              />
                              <Label htmlFor="izinLingkungan-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLingkungan-no"
                                name="izinLingkungan"
                                value="no"
                                checked={supplierComplianceForm.izinLingkungan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkungan: e.target.value }))}
                              />
                              <Label htmlFor="izinLingkungan-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinLingkunganKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkunganKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinLingkunganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. Izin / Rintek TPS Limbah B3 */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Izin / Rintek TPS Limbah B3</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinRintek-yes"
                                name="izinRintekTPS"
                                value="yes"
                                checked={supplierComplianceForm.izinRintekTPS === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPS: e.target.value }))}
                              />
                              <Label htmlFor="izinRintek-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinRintek-no"
                                name="izinRintekTPS"
                                value="no"
                                checked={supplierComplianceForm.izinRintekTPS === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPS: e.target.value }))}
                              />
                              <Label htmlFor="izinRintek-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinRintekTPSKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPSKeterangan: e.target.value }))}
                              rows={2}
                            />
                            {supplierComplianceForm.izinRintekTPS === 'yes' ? (
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'izinRintekDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                  maxNumberOfFiles={10}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            ) : supplierComplianceForm.izinRintekTPS === 'no' ? (
                              <div className="space-y-2">
                                <Label>Status:</Label>
                                <Select 
                                  value={supplierComplianceForm.izinRintekTPSStatus || ''} 
                                  onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPSStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tidak-ada">Tidak ada</SelectItem>
                                    <SelectItem value="dalam-proses">Dalam proses</SelectItem>
                                    <SelectItem value="tidak-relevan">Tidak relevan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* c. Izin / Pertek Pengelolaan Limbah Cair Industri */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Izin / Pertek Pengelolaan Limbah Cair Industri</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLimbahCair-yes"
                                name="izinLimbahCair"
                                value="yes"
                                checked={supplierComplianceForm.izinLimbahCair === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCair: e.target.value }))}
                              />
                              <Label htmlFor="izinLimbahCair-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLimbahCair-no"
                                name="izinLimbahCair"
                                value="no"
                                checked={supplierComplianceForm.izinLimbahCair === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCair: e.target.value }))}
                              />
                              <Label htmlFor="izinLimbahCair-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinLimbahCairKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCairKeterangan: e.target.value }))}
                              rows={2}
                            />
                            {supplierComplianceForm.izinLimbahCair === 'yes' ? (
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'izinLimbahCairDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                  maxNumberOfFiles={10}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            ) : supplierComplianceForm.izinLimbahCair === 'no' ? (
                              <div className="space-y-2">
                                <Label>Status:</Label>
                                <Select 
                                  value={supplierComplianceForm.izinLimbahCairStatus || ''} 
                                  onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCairStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tidak-ada">Tidak ada</SelectItem>
                                    <SelectItem value="dalam-proses">Dalam proses</SelectItem>
                                    <SelectItem value="tidak-relevan">Tidak relevan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* d. Persetujuan Teknis ANDALALIN */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. Persetujuan Teknis ANDALALIN</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="andalalin-yes"
                                name="persetujuanAndalalin"
                                value="yes"
                                checked={supplierComplianceForm.persetujuanAndalalin === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalin: e.target.value }))}
                              />
                              <Label htmlFor="andalalin-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="andalalin-no"
                                name="persetujuanAndalalin"
                                value="no"
                                checked={supplierComplianceForm.persetujuanAndalalin === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalin: e.target.value }))}
                              />
                              <Label htmlFor="andalalin-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.persetujuanAndalalinKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalinKeterangan: e.target.value }))}
                              rows={2}
                            />
                            {supplierComplianceForm.persetujuanAndalalin === 'yes' ? (
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'andalalinDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                  maxNumberOfFiles={10}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            ) : supplierComplianceForm.persetujuanAndalalin === 'no' ? (
                              <div className="space-y-2">
                                <Label>Status:</Label>
                                <Select 
                                  value={supplierComplianceForm.persetujuanAndalalinStatus || ''} 
                                  onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalinStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tidak-ada">Tidak ada</SelectItem>
                                    <SelectItem value="dalam-proses">Dalam proses</SelectItem>
                                    <SelectItem value="tidak-relevan">Tidak relevan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* e. Daftar pestisida dan izin edar yang masih berlaku */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">e. Daftar pestisida dan izin edar yang masih berlaku</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarPestisida-yes"
                                name="daftarPestisida"
                                value="yes"
                                checked={supplierComplianceForm.daftarPestisida === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisida: e.target.value }))}
                              />
                              <Label htmlFor="daftarPestisida-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarPestisida-no"
                                name="daftarPestisida"
                                value="no"
                                checked={supplierComplianceForm.daftarPestisida === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisida: e.target.value }))}
                              />
                              <Label htmlFor="daftarPestisida-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.daftarPestisidaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisidaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'daftarPestisidaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* Berikan Bukti Pelaksanaan prosedur */}
                        <div className="space-y-6 border-t pt-4 mt-6">
                          <Label className="font-medium text-blue-700">Berikan Bukti Pelaksanaan prosedur point II diatas</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiPelaksanaanII-yes"
                                name="buktiPelaksanaanII"
                                value="yes"
                                checked={supplierComplianceForm.buktiPelaksanaanII === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanII: e.target.value }))}
                              />
                              <Label htmlFor="buktiPelaksanaanII-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiPelaksanaanII-no"
                                name="buktiPelaksanaanII"
                                value="no"
                                checked={supplierComplianceForm.buktiPelaksanaanII === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanII: e.target.value }))}
                              />
                              <Label htmlFor="buktiPelaksanaanII-no">No</Label>
                            </div>
                          </div>

                          {/* a. Laporan Pelaksanaan RKL/RPL */}
                          <div className="space-y-4 border-t pt-4">
                            <Label className="font-medium">a. Laporan Pelaksanaan RKL/RPL</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanRKLRPL-yes"
                                  name="laporanRKLRPL"
                                  value="yes"
                                  checked={supplierComplianceForm.laporanRKLRPL === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPL: e.target.value }))}
                                />
                                <Label htmlFor="laporanRKLRPL-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanRKLRPL-no"
                                  name="laporanRKLRPL"
                                  value="no"
                                  checked={supplierComplianceForm.laporanRKLRPL === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPL: e.target.value }))}
                                />
                                <Label htmlFor="laporanRKLRPL-no">No</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.laporanRKLRPLKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPLKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'laporanRKLRPLDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>

                          {/* b. Laporan Penggunaan Pestisida */}
                          <div className="space-y-4 border-t pt-4">
                            <Label className="font-medium">b. Laporan Penggunaan Pestisida</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanPestisida-yes"
                                  name="laporanPestisida"
                                  value="yes"
                                  checked={supplierComplianceForm.laporanPestisida === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisida: e.target.value }))}
                                />
                                <Label htmlFor="laporanPestisida-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanPestisida-no"
                                  name="laporanPestisida"
                                  value="no"
                                  checked={supplierComplianceForm.laporanPestisida === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisida: e.target.value }))}
                                />
                                <Label htmlFor="laporanPestisida-no">No</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.laporanPestisidaKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisidaKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'laporanPestisidaDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* III. Peraturan Kehutanan */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">III. Peraturan Kehutanan</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah lokasi konsesi perkebunan berada di areal yang telah memperoleh pelepasan kawasan hutan atau di luar kawasan hutan sesuai dengan ketentuan peraturan perundang-undangan</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="peraturanKehutanan-yes"
                              name="peraturanKehutanan"
                              value="yes"
                              checked={supplierComplianceForm.peraturanKehutanan === 'yes'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutanan: e.target.value }))}
                            />
                            <Label htmlFor="peraturanKehutanan-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="peraturanKehutanan-no"
                              name="peraturanKehutanan"
                              value="no"
                              checked={supplierComplianceForm.peraturanKehutanan === 'no'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutanan: e.target.value }))}
                            />
                            <Label htmlFor="peraturanKehutanan-no">No</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.peraturanKehutananKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutananKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'peraturanKehutananDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* IV. Hak Pihak Ke 3 termasuk Masyarakat Adat */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">IV. Hak Pihak Ke 3 termasuk Masyarakat Adat</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah dalam pembukaan atau pengembangan kebun kelapa sawit terdapat konflik dengan pihak ke 3 termasuk masyarakat adat</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hakPihakKetiga-yes"
                              name="hakPihakKetiga"
                              value="yes"
                              checked={supplierComplianceForm.hakPihakKetiga === 'yes'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetiga: e.target.value }))}
                            />
                            <Label htmlFor="hakPihakKetiga-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hakPihakKetiga-no"
                              name="hakPihakKetiga"
                              value="no"
                              checked={supplierComplianceForm.hakPihakKetiga === 'no'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetiga: e.target.value }))}
                            />
                            <Label htmlFor="hakPihakKetiga-no">No</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.hakPihakKetigaKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetigaKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'hakPihakKetigaDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kewajiban Pengembangan Plasma */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Kewajiban Pengembangan Plasma minimun 20 % dari Lahan yang di Usahakan</h3>
                      <div className="space-y-4">
                        
                        {/* a. MoU Kerja sama */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. MoU Kerja sama</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="mouKerjasama-yes"
                                name="mouKerjasama"
                                value="yes"
                                checked={supplierComplianceForm.mouKerjasama === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjasama: e.target.value }))}
                              />
                              <Label htmlFor="mouKerjasama-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="mouKerjasama-no"
                                name="mouKerjasama"
                                value="no"
                                checked={supplierComplianceForm.mouKerjasama === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjasama: e.target.value }))}
                              />
                              <Label htmlFor="mouKerjasama-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.mouKerjasamaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjasamaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'mouKerjasamaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. SK CPCL */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. SK CPCL (Calon Petani Calon Lahan)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skCPCL-yes"
                                name="skCPCL"
                                value="yes"
                                checked={supplierComplianceForm.skCPCL === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCL: e.target.value }))}
                              />
                              <Label htmlFor="skCPCL-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skCPCL-no"
                                name="skCPCL"
                                value="no"
                                checked={supplierComplianceForm.skCPCL === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCL: e.target.value }))}
                              />
                              <Label htmlFor="skCPCL-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skCPCLKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCLKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skCPCLDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Laporan Realisasi Plasma */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Laporan Realisasi Plasma</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanRealisasiPlasma-yes"
                                name="laporanRealisasiPlasma"
                                value="yes"
                                checked={supplierComplianceForm.laporanRealisasiPlasma === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasma: e.target.value }))}
                              />
                              <Label htmlFor="laporanRealisasiPlasma-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanRealisasiPlasma-no"
                                name="laporanRealisasiPlasma"
                                value="no"
                                checked={supplierComplianceForm.laporanRealisasiPlasma === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasma: e.target.value }))}
                              />
                              <Label htmlFor="laporanRealisasiPlasma-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanRealisasiPlasmaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasmaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'laporanRealisasiPlasmaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bukti Implementasi Point 3.5 */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Bukti Implementasi Point 3.5</h3>
                      <div className="space-y-4">
                        
                        {/* a. Bukti GRTT */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Bukti GRTT (Jika Ada)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiGRTT-yes"
                                name="buktiGRTT"
                                value="yes"
                                checked={supplierComplianceForm.buktiGRTT === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiGRTT: e.target.value }))}
                              />
                              <Label htmlFor="buktiGRTT-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiGRTT-no"
                                name="buktiGRTT"
                                value="no"
                                checked={supplierComplianceForm.buktiGRTT === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiGRTT: e.target.value }))}
                              />
                              <Label htmlFor="buktiGRTT-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.buktiGRTTKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiGRTTKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'buktiGRTTDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. Bukti FPIC */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Bukti FPIC (Jika Ada)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiFPIC-yes"
                                name="buktiFPIC"
                                value="yes"
                                checked={supplierComplianceForm.buktiFPIC === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiFPIC: e.target.value }))}
                              />
                              <Label htmlFor="buktiFPIC-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiFPIC-no"
                                name="buktiFPIC"
                                value="no"
                                checked={supplierComplianceForm.buktiFPIC === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiFPIC: e.target.value }))}
                              />
                              <Label htmlFor="buktiFPIC-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.buktiFPICKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiFPICKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'buktiFPICDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Penanganan Permintaan Informasi */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Penanganan Permintaan Informasi</Label>
                          
                          {/* 1) Surat Masuk */}
                          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                            <Label className="font-medium">1) Surat Masuk</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratMasukInformasi-yes"
                                  name="suratMasukInformasi"
                                  value="yes"
                                  checked={supplierComplianceForm.suratMasukInformasi === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukInformasi: e.target.value }))}
                                />
                                <Label htmlFor="suratMasukInformasi-yes">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratMasukInformasi-no"
                                  name="suratMasukInformasi"
                                  value="no"
                                  checked={supplierComplianceForm.suratMasukInformasi === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukInformasi: e.target.value }))}
                                />
                                <Label htmlFor="suratMasukInformasi-no">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.suratMasukInformasiKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukInformasiKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratMasukInformasiDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>

                          {/* 2) Surat Keluar */}
                          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                            <Label className="font-medium">2) Surat Keluar</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratKeluarInformasi-yes"
                                  name="suratKeluarInformasi"
                                  value="yes"
                                  checked={supplierComplianceForm.suratKeluarInformasi === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarInformasi: e.target.value }))}
                                />
                                <Label htmlFor="suratKeluarInformasi-yes">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratKeluarInformasi-no"
                                  name="suratKeluarInformasi"
                                  value="no"
                                  checked={supplierComplianceForm.suratKeluarInformasi === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarInformasi: e.target.value }))}
                                />
                                <Label htmlFor="suratKeluarInformasi-no">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.suratKeluarInformasiKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarInformasiKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratKeluarInformasiDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* d. Penanganan Keluhan Stakeholder */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. Penanganan Keluhan Stakeholder</Label>
                          
                          {/* 1) Surat Masuk */}
                          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                            <Label className="font-medium">1) Surat Masuk</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratMasukKeluhan-yes"
                                  name="suratMasukKeluhan"
                                  value="yes"
                                  checked={supplierComplianceForm.suratMasukKeluhan === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukKeluhan: e.target.value }))}
                                />
                                <Label htmlFor="suratMasukKeluhan-yes">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratMasukKeluhan-no"
                                  name="suratMasukKeluhan"
                                  value="no"
                                  checked={supplierComplianceForm.suratMasukKeluhan === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukKeluhan: e.target.value }))}
                                />
                                <Label htmlFor="suratMasukKeluhan-no">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.suratMasukKeluhanKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukKeluhanKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratMasukKeluhanDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>

                          {/* 2) Surat Keluar */}
                          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                            <Label className="font-medium">2) Surat Keluar</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratKeluarKeluhan-yes"
                                  name="suratKeluarKeluhan"
                                  value="yes"
                                  checked={supplierComplianceForm.suratKeluarKeluhan === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarKeluhan: e.target.value }))}
                                />
                                <Label htmlFor="suratKeluarKeluhan-yes">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratKeluarKeluhan-no"
                                  name="suratKeluarKeluhan"
                                  value="no"
                                  checked={supplierComplianceForm.suratKeluarKeluhan === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarKeluhan: e.target.value }))}
                                />
                                <Label htmlFor="suratKeluarKeluhan-no">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.suratKeluarKeluhanKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarKeluhanKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratKeluarKeluhanDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Laporan penyelesaian sengketa lahan */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Laporan penyelesaian sengketa lahan (Jika Ada)</h3>
                      <div className="space-y-4">
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanSengketaLahan-yes"
                              name="laporanSengketaLahan"
                              value="yes"
                              checked={supplierComplianceForm.laporanSengketaLahan === 'yes'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanSengketaLahan: e.target.value }))}
                            />
                            <Label htmlFor="laporanSengketaLahan-yes">Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanSengketaLahan-no"
                              name="laporanSengketaLahan"
                              value="no"
                              checked={supplierComplianceForm.laporanSengketaLahan === 'no'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanSengketaLahan: e.target.value }))}
                            />
                            <Label htmlFor="laporanSengketaLahan-no">Tidak</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.laporanSengketaLahanKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanSengketaLahanKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'laporanSengketaLahanDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* V. Hak Buruh dan Hak Asasi Manusia */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">V. Hak Buruh dan Hak Asasi Manusia</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Jelaskan Komitmen Perusahaan Terhadap Hak Buruh dan Hak Asasi Pekerja</Label>
                        
                        {/* a. Kebijakan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Kebijakan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="kebijakanHAM-yes"
                                name="kebijakanHAM"
                                value="yes"
                                checked={supplierComplianceForm.kebijakanHAM === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHAM: e.target.value }))}
                              />
                              <Label htmlFor="kebijakanHAM-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="kebijakanHAM-no"
                                name="kebijakanHAM"
                                value="no"
                                checked={supplierComplianceForm.kebijakanHAM === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHAM: e.target.value }))}
                              />
                              <Label htmlFor="kebijakanHAM-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.kebijakanHAMKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHAMKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'kebijakanHAMDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. SOP/Mekanisme Ketenagakerjaan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. SOP/Mekanisme yang berhubungan dengan Ketenagakerjaan</Label>
                          <div className="text-sm text-gray-600 mb-4">
                            <p>Seperti:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>SOP/Mekanisme Rekrutmen Karyawan</li>
                              <li>SOP/Mekanisme Penilaian Kinerja Karyawan</li>
                              <li>SOP/Mekanisme Promosi Karyawan</li>
                              <li>SOP/Mekanisme Pembayaran Upah</li>
                              <li>SOP/Mekanisme Insentif Kerja/Lembur</li>
                              <li>SOP/Mekanisme Cuti Karyawan</li>
                              <li>SOP/Mekanisme Penanganan Keluhan Karyawan</li>
                              <li>Dst.</li>
                            </ul>
                          </div>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopKetenagakerjaan-yes"
                                name="sopKetenagakerjaan"
                                value="yes"
                                checked={supplierComplianceForm.sopKetenagakerjaan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKetenagakerjaan: e.target.value }))}
                              />
                              <Label htmlFor="sopKetenagakerjaan-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopKetenagakerjaan-no"
                                name="sopKetenagakerjaan"
                                value="no"
                                checked={supplierComplianceForm.sopKetenagakerjaan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKetenagakerjaan: e.target.value }))}
                              />
                              <Label htmlFor="sopKetenagakerjaan-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sopKetenagakerjaanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKetenagakerjaanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sopKetenagakerjaanDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. SOP/Mekanisme K3 */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. SOP/Mekanisme yang berhubungan dengan K3</Label>
                          <div className="text-sm text-gray-600 mb-4">
                            <p>Seperti:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>SOP/Mekanisme Analisis Keselamatan Kerja</li>
                              <li>SOP/Mekanisme Panitia Pembina Keselamatan, Kesehatan Kerja dan Lingkungan</li>
                              <li>SOP/Mekanisme Pertolongan Pertama pada kecelakaan</li>
                              <li>SOP/Mekanisme Pelaporan dan Penyelidikan Kecelakaan Kerja</li>
                              <li>SOP/Mekanisme Inspeksi Pengelolaan Kerja</li>
                              <li>Dst.</li>
                            </ul>
                          </div>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopK3-yes"
                                name="sopK3"
                                value="yes"
                                checked={supplierComplianceForm.sopK3 === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopK3: e.target.value }))}
                              />
                              <Label htmlFor="sopK3-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopK3-no"
                                name="sopK3"
                                value="no"
                                checked={supplierComplianceForm.sopK3 === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopK3: e.target.value }))}
                              />
                              <Label htmlFor="sopK3-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sopK3Keterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopK3Keterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sopK3Dokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Berikan Bukti Pelaksanaan prosedur point 3.9 */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Berikan Bukti Pelaksanaan prosedur point 3.9 diatas</h3>
                      <div className="space-y-4">
                        
                        {/* a. Bukti Pencatatan perjanjian kerja ke DISNAKER */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Bukti Pencatatan perjanjian kerja ke DISNAKER</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiDisnaker-yes"
                                name="buktiDisnaker"
                                value="yes"
                                checked={supplierComplianceForm.buktiDisnaker === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiDisnaker: e.target.value }))}
                              />
                              <Label htmlFor="buktiDisnaker-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiDisnaker-no"
                                name="buktiDisnaker"
                                value="no"
                                checked={supplierComplianceForm.buktiDisnaker === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiDisnaker: e.target.value }))}
                              />
                              <Label htmlFor="buktiDisnaker-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.buktiDisnakerKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiDisnakerKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'buktiDisnakerDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. Daftar Karyawan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Daftar Karyawan, Mencakup:</Label>
                          <div className="text-sm text-gray-600 mb-4">
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Nama</li>
                              <li>Tempat, Tanggal Lahir</li>
                              <li>Jenis Kelamin</li>
                            </ul>
                          </div>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarKaryawan-yes"
                                name="daftarKaryawan"
                                value="yes"
                                checked={supplierComplianceForm.daftarKaryawan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarKaryawan: e.target.value }))}
                              />
                              <Label htmlFor="daftarKaryawan-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarKaryawan-no"
                                name="daftarKaryawan"
                                value="no"
                                checked={supplierComplianceForm.daftarKaryawan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarKaryawan: e.target.value }))}
                              />
                              <Label htmlFor="daftarKaryawan-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.daftarKaryawanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarKaryawanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'daftarKaryawanDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. SK UMR / Penggajian */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. SK UMR / Penggajian</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skUMR-yes"
                                name="skUMR"
                                value="yes"
                                checked={supplierComplianceForm.skUMR === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skUMR: e.target.value }))}
                              />
                              <Label htmlFor="skUMR-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skUMR-no"
                                name="skUMR"
                                value="no"
                                checked={supplierComplianceForm.skUMR === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skUMR: e.target.value }))}
                              />
                              <Label htmlFor="skUMR-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skUMRKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skUMRKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skUMRDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* d. SK Pembentukan Serikat Pekerja */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. SK Pembentukan dan atau SK Pengesahan Serikat Pekerja / SK LKS Bipartit (Jika Tidak ada Serikat)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skSerikatPekerja-yes"
                                name="skSerikatPekerja"
                                value="yes"
                                checked={supplierComplianceForm.skSerikatPekerja === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skSerikatPekerja: e.target.value }))}
                              />
                              <Label htmlFor="skSerikatPekerja-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skSerikatPekerja-no"
                                name="skSerikatPekerja"
                                value="no"
                                checked={supplierComplianceForm.skSerikatPekerja === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skSerikatPekerja: e.target.value }))}
                              />
                              <Label htmlFor="skSerikatPekerja-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skSerikatPekerjaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skSerikatPekerjaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skSerikatPekerjaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* e. Bukti Terdaftar BPJS */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">e. Bukti Terdaftar BPJS TK dan Kesehatan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiBPJS-yes"
                                name="buktiBPJS"
                                value="yes"
                                checked={supplierComplianceForm.buktiBPJS === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiBPJS: e.target.value }))}
                              />
                              <Label htmlFor="buktiBPJS-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiBPJS-no"
                                name="buktiBPJS"
                                value="no"
                                checked={supplierComplianceForm.buktiBPJS === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiBPJS: e.target.value }))}
                              />
                              <Label htmlFor="buktiBPJS-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.buktiBPJSKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiBPJSKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'buktiBPJSDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* f. Laporan P2K3 / Sertifikat SMK3 */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">f. Laporan P2K3 / Sertifikat SMK3</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanP2K3-yes"
                                name="laporanP2K3"
                                value="yes"
                                checked={supplierComplianceForm.laporanP2K3 === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanP2K3: e.target.value }))}
                              />
                              <Label htmlFor="laporanP2K3-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanP2K3-no"
                                name="laporanP2K3"
                                value="no"
                                checked={supplierComplianceForm.laporanP2K3 === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanP2K3: e.target.value }))}
                              />
                              <Label htmlFor="laporanP2K3-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanP2K3Keterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanP2K3Keterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'laporanP2K3Dokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VI. Peraturan Perpajakan, Antikorupsi, perdagangan dan Bea Cukai */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">VI. Peraturan Perpajakan, Antikorupsi, perdagangan dan Bea Cukai</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Jelaskan Komitmen Perusahaan Terhadap Kebijakan Terkait Peraturan Perpajakan, Antikorupsi, perdagangan dan Bea Cukai</Label>
                        
                        {/* a. Kebijakan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Kebijakan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="kebijakanPerpajakan-yes"
                                name="kebijakanPerpajakan"
                                value="yes"
                                checked={supplierComplianceForm.kebijakanPerpajakan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerpajakan: e.target.value }))}
                              />
                              <Label htmlFor="kebijakanPerpajakan-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="kebijakanPerpajakan-no"
                                name="kebijakanPerpajakan"
                                value="no"
                                checked={supplierComplianceForm.kebijakanPerpajakan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerpajakan: e.target.value }))}
                              />
                              <Label htmlFor="kebijakanPerpajakan-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.kebijakanPerpajakanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerpajakanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'kebijakanPerpajakanDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. SOP/Mekanisme Kode Etik Bisnis */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. SOP/Mekanisme yang berhubungan dengan Kode etik bisnis (Penanganan Laporan Terkait dengan Kode Etik Bisnis seperti: Korupsi, Kolusi)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopKodeEtikBisnis-yes"
                                name="sopKodeEtikBisnis"
                                value="yes"
                                checked={supplierComplianceForm.sopKodeEtikBisnis === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKodeEtikBisnis: e.target.value }))}
                              />
                              <Label htmlFor="sopKodeEtikBisnis-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopKodeEtikBisnis-no"
                                name="sopKodeEtikBisnis"
                                value="no"
                                checked={supplierComplianceForm.sopKodeEtikBisnis === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKodeEtikBisnis: e.target.value }))}
                              />
                              <Label htmlFor="sopKodeEtikBisnis-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sopKodeEtikBisnisKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKodeEtikBisnisKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sopKodeEtikBisnisDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Saluran Pengaduan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Saluran Pengaduan yang dapat diakses Publik</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="saluranPengaduan-yes"
                                name="saluranPengaduan"
                                value="yes"
                                checked={supplierComplianceForm.saluranPengaduan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, saluranPengaduan: e.target.value }))}
                              />
                              <Label htmlFor="saluranPengaduan-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="saluranPengaduan-no"
                                name="saluranPengaduan"
                                value="no"
                                checked={supplierComplianceForm.saluranPengaduan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, saluranPengaduan: e.target.value }))}
                              />
                              <Label htmlFor="saluranPengaduan-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.saluranPengaduanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, saluranPengaduanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'saluranPengaduanDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bukti Terdaftar Pajak dan pemenuhan persyaratan eksport */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Bukti Terdaftar Pajak dan pemenuhan persyaratan eksport</h3>
                      <div className="space-y-4">
                        
                        {/* a. Surat keterangan Terdaftar Pajak */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Surat keterangan Terdaftar Pajak</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="suratTerdaftarPajak-yes"
                                name="suratTerdaftarPajak"
                                value="yes"
                                checked={supplierComplianceForm.suratTerdaftarPajak === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajak: e.target.value }))}
                              />
                              <Label htmlFor="suratTerdaftarPajak-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="suratTerdaftarPajak-no"
                                name="suratTerdaftarPajak"
                                value="no"
                                checked={supplierComplianceForm.suratTerdaftarPajak === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajak: e.target.value }))}
                              />
                              <Label htmlFor="suratTerdaftarPajak-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.suratTerdaftarPajakKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajakKeterangan: e.target.value }))}
                              rows={2}
                            />
                            {supplierComplianceForm.suratTerdaftarPajak === 'yes' ? (
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratTerdaftarPajakDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                  maxNumberOfFiles={10}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            ) : supplierComplianceForm.suratTerdaftarPajak === 'no' ? (
                              <div className="space-y-2">
                                <Label>Status:</Label>
                                <Select 
                                  value={supplierComplianceForm.suratTerdaftarPajakStatus || ''} 
                                  onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajakStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tidak-ada">Tidak ada</SelectItem>
                                    <SelectItem value="dalam-proses">Dalam proses</SelectItem>
                                    <SelectItem value="tidak-relevan">Tidak relevan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* b. NPWP */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. NPWP</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="npwp-yes"
                                name="npwp"
                                value="yes"
                                checked={supplierComplianceForm.npwp === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, npwp: e.target.value }))}
                              />
                              <Label htmlFor="npwp-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="npwp-no"
                                name="npwp"
                                value="no"
                                checked={supplierComplianceForm.npwp === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, npwp: e.target.value }))}
                              />
                              <Label htmlFor="npwp-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.npwpKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, npwpKeterangan: e.target.value }))}
                              rows={2}
                            />
                            {supplierComplianceForm.npwp === 'yes' ? (
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'npwpDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                  maxNumberOfFiles={10}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            ) : supplierComplianceForm.npwp === 'no' ? (
                              <div className="space-y-2">
                                <Label>Status:</Label>
                                <Select 
                                  value={supplierComplianceForm.npwpStatus || ''} 
                                  onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, npwpStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tidak-ada">Tidak ada</SelectItem>
                                    <SelectItem value="dalam-proses">Dalam proses</SelectItem>
                                    <SelectItem value="tidak-relevan">Tidak relevan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <Button 
                      type="submit" 
                      data-testid="button-submit-supplier-compliance"
                      className="w-full" 
                      disabled={createSupplierComplianceMutation.isPending}
                    >
                      {createSupplierComplianceMutation.isPending ? 'Menyimpan...' : 'Simpan Data Supplier Compliance'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hasil Penilaian Kepatuhan Supplier</CardTitle>
                <CardDescription>
                  Daftar supplier yang telah dinilai tingkat kepatuhannya terhadap regulasi hukum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Supplier</TableHead>
                        <TableHead>Tingkat Kepatuhan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Penilaian</TableHead>
                        <TableHead>Kontak</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierComplianceData.map((compliance: any) => {
                        const analysis = analysisResults.find(r => r.supplierId === compliance.id?.toString());
                        return (
                          <TableRow key={compliance.id}>
                          <TableCell className="font-medium">{compliance.namaSupplier}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    compliance.tingkatKepatuhan >= 90 ? 'bg-green-500' : 
                                    compliance.tingkatKepatuhan >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${compliance.tingkatKepatuhan}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{compliance.tingkatKepatuhan}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={compliance.tingkatKepatuhan >= 90 ? 'default' : compliance.tingkatKepatuhan >= 75 ? 'secondary' : 'destructive'}>
                              {compliance.statusKepatuhan}
                            </Badge>
                          </TableCell>
                          <TableCell>{compliance.tanggalPenilaian}</TableCell>
                          <TableCell className="text-sm">
                            <div>{compliance.nomorTelefonTimInternal}</div>
                            <div className="text-muted-foreground">{compliance.emailKontak}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </TooltipProvider>
  );
}
