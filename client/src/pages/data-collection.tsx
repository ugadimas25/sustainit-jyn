import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { FileText, Upload, Satellite, Plus, Trash2, Eye } from 'lucide-react';
import type { UploadResult } from '@uppy/core';
import { 
  insertEstateDataCollectionSchema, 
  insertSmallholderDataCollectionSchema,
  insertMillDataCollectionSchema,
  insertKcpDataCollectionSchema,
  insertBulkingDataCollectionSchema,
  type InsertEstateDataCollection,
  type InsertSmallholderDataCollection,
  type InsertMillDataCollection,
  type InsertKcpDataCollection,
  type InsertBulkingDataCollection
} from '@shared/schema';

export default function DataCollection() {
  const [supplierType, setSupplierType] = useState('');
  const [revisionMode, setRevisionMode] = useState<{
    approvalId: string;
    entityId: string;
    entityType: string;
  } | null>(null);
  const { toast } = useToast();

  // Fetch submitted data collections
  const { data: estateData = [] as any[] } = useQuery({
    queryKey: ['/api/estate-data-collection'],
  });

  const { data: millData = [] as any[] } = useQuery({
    queryKey: ['/api/mill-data-collection'],
  });

  const { data: smallholderData = [] as any[] } = useQuery({
    queryKey: ['/api/traceability-data-collection'],
  });

  const { data: kcpData = [] as any[] } = useQuery({
    queryKey: ['/api/kcp-data-collection'],
  });

  const { data: bulkingData = [] as any[] } = useQuery({
    queryKey: ['/api/bulking-data-collection'],
  });

  // Check for revision mode on component mount
  useEffect(() => {
    const revisingApprovalId = localStorage.getItem('revising_approval_id');
    const revisingEntityId = localStorage.getItem('revising_entity_id');
    const revisingEntityType = localStorage.getItem('revising_entity_type');

    if (revisingApprovalId && revisingEntityId && revisingEntityType) {
      setRevisionMode({
        approvalId: revisingApprovalId,
        entityId: revisingEntityId,
        entityType: revisingEntityType
      });

      // Set supplier type based on entity type
      if (revisingEntityType === 'estate_data') {
        setSupplierType('estate');
        loadEstateData(revisingEntityId);
      } else if (revisingEntityType === 'mill_data') {
        setSupplierType('mill');
        loadMillData(revisingEntityId);
      } else if (revisingEntityType === 'smallholder_data') {
        setSupplierType('smallholders');
        loadSmallholderData(revisingEntityId);
      } else if (revisingEntityType === 'kcp_data') {
        setSupplierType('kcp');
        loadKcpData(revisingEntityId);
      } else if (revisingEntityType === 'bulking_data') {
        setSupplierType('bulking');
        loadBulkingData(revisingEntityId);
      }

      toast({
        title: "Revision Mode",
        description: "Loading existing data for revision. Update the form and submit to complete your revision.",
      });
    }
  }, []);

  // Load functions for each entity type
  const loadEstateData = async (entityId: string) => {
    try {
      const data = await apiRequest(`/api/estate-data-collection/${entityId}`, 'GET');
      setEstateForm(data);
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load estate data for revision.",
        variant: "destructive"
      });
    }
  };

  const loadMillData = async (entityId: string) => {
    try {
      const data = await apiRequest(`/api/mill-data-collection/${entityId}`, 'GET');
      setMillForm(data);
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load mill data for revision.",
        variant: "destructive"
      });
    }
  };

  const loadSmallholderData = async (entityId: string) => {
    try {
      const data = await apiRequest(`/api/traceability-data-collection/${entityId}`, 'GET');
      setSmallholdersForm(data);
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load smallholder data for revision.",
        variant: "destructive"
      });
    }
  };

  const loadKcpData = async (entityId: string) => {
    try {
      const data = await apiRequest(`/api/kcp-data-collection/${entityId}`, 'GET');
      setKcpForm(data);
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load KCP data for revision.",
        variant: "destructive"
      });
    }
  };

  const loadBulkingData = async (entityId: string) => {
    try {
      const data = await apiRequest(`/api/bulking-data-collection/${entityId}`, 'GET');
      setBulkingForm(data);
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load bulking data for revision.",
        variant: "destructive"
      });
    }
  };

  // Form states for all collection types
  const [estateForm, setEstateForm] = useState({
    // Bagian 1 - Informasi Umum
    namaSupplier: '',
    namaGroup: '',
    aktaPendirianPerusahaan: '', // document URL
    aktaPerubahan: '', // document URL (Jika Ada)
    izinBerusaha: '', // Nomor Induk Berusaha
    
    // Alamat
    alamatKantor: '',
    alamatKebun: '',
    
    // Koordinat
    koordinatKebun: '',
    koordinatKantor: '',
    
    // Jenis kebun dan supplier
    jenisKebun: '', // Jenis kebun dari form
    jenisSupplier: '', // Kebun plasma yang dikelola penuh oleh perusahaan (KKPA), Kebun dalam satu grup manajemen (sister company), Kebun pihak ketiga (PT/ CV/ Koperasi)
    totalProduksiTBSTahun: '', // kurun 1 tahun terakhir
    
    // Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahan
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    
    // Tanda Tangan
    tandaTangan: '',
    tempatTanggal: '',
    
    // Bagian 2 - Sumber TBS (Daftar Kebun)
    daftarKebun: [{
      no: 1,
      namaKebun: '',
      alamat: '',
      koordinatLongitude: '',
      koordinatLatitude: '',
      polygonKebun: '',
      luasLahan: '', // Ha
      tahunTanam: '',
      jenisBibit: '',
      produksiTBS1TahunTerakhir: ''
    }]
  });

  const [smallholdersForm, setSmallholdersForm] = useState({
    // Form Kemampuan Telusur (Traceability) TBS Luar
    nomorDO: '',
    pemegangDO: '',
    alamatPemegangDO: '',
    lokasiUsaha: '', // Lokasi Ramp / Alamat Terdaftar CV / Koperasi / Usaha Individu
    
    // Legalitas Pemegang DO
    aktaPendirianUsaha: '', // document URL - Jika Berbadan Hukum
    nib: '',
    npwp: '',
    
    luasLahanTertanamPetaniSupplier: '',
    volumeTBS: '',
    
    // Daftar Petani Pemasok TBS
    daftarPetaniPemasokTBS: [{
      no: 1,
      namaPetani: '',
      alamatTempatTinggal: '',
      lokasiKebun: '',
      luas: '', // Ha
      // Legalitas Lahan
      stdb: '', // document URL
      sppl: '', // document URL
      nomorObjekPajakPBB: '',
      longitude: '',
      latitude: '',
      polygon: '',
      tahunTanam: ''
    }]
  });

  const [millForm, setMillForm] = useState({
    // Bagian 1 - Informasi Umum
    umlId: '',
    namaPabrik: '',
    namaGroup: '',
    alamatKantor: '',
    alamatPabrik: '',
    koordinatPabrik: '',
    koordinatKantor: '',
    aktaPendirian: '', // document URL
    aktaPerubahan: '', // document URL
    izinBerusaha: '', // NIB
    tipeSertifikat: '', // ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    
    // Bagian 2 - Data Internal  
    jenisSupplier: '', // KKPA/Sister Company/Pihak Ketiga
    kuantitasCPOPK: '', // M/T
    tanggalPengisianKuisioner: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    
    // Tim Internal
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // Bagian 3 - Asal TBS
    asalTBS: [{
      no: 1,
      namaEstateKebun: '',
      alamat: '',
      koordinat: '',
      luasLahan: '',
      jenisSupplierTBS: '', // Estate Sendiri / Pihak Ketiga / Smallholder
      volumeTBS: '', // Ton/bulan
      persentase: ''
    }]
  });

  const [kcpForm, setKcpForm] = useState({
    ublFacilityId: '',
    namaKCP: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatKCP: '',
    koordinatKantor: '',
    koordinatKCP: '',
    modelChainOfCustody: '',
    kapasitasOlahMTHari: 0,
    kapasitasOlah: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: ''
  });

  const [bulkingForm, setBulkingForm] = useState({
    ublFacilityId: '',
    namaFasilitasBulking: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatBulking: '',
    modelChainOfCustody: '',
    kapasitasTotal: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: ''
  });

  // Mutations for creating data collections
  const createEstateMutation = useMutation({
    mutationFn: async (data: any) => {
      // If in revision mode, call the revise endpoint
      if (revisionMode && revisionMode.entityType === 'estate_data') {
        return apiRequest(`/api/approvals/${revisionMode.approvalId}/revise`, 'POST', {
          entity_name: data.namaSupplier,
          comments: 'Data revised and resubmitted for approval'
        });
      }
      // Otherwise, create new record
      return apiRequest('/api/estate-data-collection', 'POST', data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/estate-data-collection'] });
      queryClient.invalidateQueries({ queryKey: ['/api/approvals'] });
      
      // Clear revision mode and localStorage
      if (revisionMode) {
        localStorage.removeItem('revising_approval_id');
        localStorage.removeItem('revising_entity_id');
        localStorage.removeItem('revising_entity_type');
        setRevisionMode(null);
        
        toast({
          title: "Revision Submitted",
          description: "Your revised data has been resubmitted for approval.",
        });
      } else {
        toast({
          title: "Data Estate berhasil disimpan",
          description: response.supplierId 
            ? `Data Estate dan Supplier telah berhasil dibuat. Supplier ID: ${response.supplierId}` 
            : "Data Estate telah berhasil disimpan ke sistem.",
        });
      }
      
      // Reset form
      setEstateForm({
        namaSupplier: '', namaGroup: '', aktaPendirianPerusahaan: '', aktaPerubahan: '', izinBerusaha: '',
        alamatKantor: '', alamatKebun: '', koordinatKebun: '', koordinatKantor: '', jenisKebun: '', jenisSupplier: '', 
        totalProduksiTBSTahun: '', namaTimInternal: '', jabatanTimInternal: '', emailTimInternal: '', 
        nomorTeleponTimInternal: '', namaPenanggungJawab: '', jabatanPenanggungJawab: '', emailPenanggungJawab: '', 
        nomorTeleponPenanggungJawab: '', tandaTangan: '', tempatTanggal: '', 
        daftarKebun: [{ no: 1, namaKebun: '', alamat: '', koordinatLongitude: '', koordinatLatitude: '', 
        polygonKebun: '', luasLahan: '', tahunTanam: '', jenisBibit: '', produksiTBS1TahunTerakhir: '' }]
      });
      
      // Reset supplier type
      setSupplierType('');
    },
  });

  const createSmallholdersMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/traceability-data-collection', 'POST', data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/traceability-data-collection'] });
      toast({
        title: "Data Smallholders berhasil disimpan",
        description: response.supplierId 
          ? `Data Smallholders dan Supplier telah berhasil dibuat. Supplier ID: ${response.supplierId}` 
          : "Data Smallholders telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setSmallholdersForm({
        nomorDO: '', pemegangDO: '', alamatPemegangDO: '', lokasiUsaha: '', aktaPendirianUsaha: '',
        nib: '', npwp: '', luasLahanTertanamPetaniSupplier: '', volumeTBS: '',
        daftarPetaniPemasokTBS: [{ no: 1, namaPetani: '', alamatTempatTinggal: '', lokasiKebun: '', luas: '', stdb: '', sppl: '', nomorObjekPajakPBB: '', longitude: '', latitude: '', polygon: '', tahunTanam: '' }]
      });
    },
  });

  const createMillMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mill-data-collection', 'POST', data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/mill-data-collection'] });
      toast({
        title: "Data Mill berhasil disimpan",
        description: response.supplierId 
          ? `Data Mill dan Supplier telah berhasil dibuat. Supplier ID: ${response.supplierId}` 
          : "Data Mill telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setMillForm({
        umlId: '', namaPabrik: '', namaGroup: '', alamatKantor: '', alamatPabrik: '', koordinatPabrik: '', koordinatKantor: '',
        aktaPendirian: '', aktaPerubahan: '', izinBerusaha: '', tipeSertifikat: '', nomorSertifikat: '', lembagaSertifikasi: '', ruangLingkupSertifikasi: '', masaBerlakuSertifikat: '',
        jenisSupplier: '', kuantitasCPOPK: '', tanggalPengisianKuisioner: '',
        namaPenanggungJawab: '', jabatanPenanggungJawab: '', emailPenanggungJawab: '', nomorTeleponPenanggungJawab: '',
        namaTimInternal: '', jabatanTimInternal: '', emailTimInternal: '', nomorTeleponTimInternal: '',
        asalTBS: [{ no: 1, namaEstateKebun: '', alamat: '', koordinat: '', luasLahan: '', jenisSupplierTBS: '', volumeTBS: '', persentase: '' }]
      });
    },
  });

  const createKcpMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/kcp-data-collection', 'POST', data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/kcp-data-collection'] });
      toast({
        title: "Data KCP berhasil disimpan",
        description: response.supplierId 
          ? `Data KCP dan Supplier telah berhasil dibuat. Supplier ID: ${response.supplierId}` 
          : "Data KCP telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setKcpForm({
        ublFacilityId: '',
        namaKCP: '',
        namaGroup: '',
        izinBerusaha: '',
        tipeSertifikat: '',
        nomorSertifikat: '',
        lembagaSertifikasi: '',
        ruangLingkupSertifikasi: '',
        masaBerlakuSertifikat: '',
        alamatKantor: '',
        alamatKCP: '',
        koordinatKantor: '',
        koordinatKCP: '',
        modelChainOfCustody: '',
        kapasitasOlahMTHari: 0,
        kapasitasOlah: 0,
        sistemPencatatan: '',
        tanggalPengisianKuisioner: '',
        namaPenanggungJawab: '',
        jabatanPenanggungJawab: '',
        emailPenanggungJawab: '',
        nomorTeleponPenanggungJawab: '',
        namaTimInternal: '',
        jabatanTimInternal: '',
        emailTimInternal: '',
        nomorTeleponTimInternal: ''
      });
    },
  });

  const createBulkingMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/bulking-data-collection', 'POST', data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulking-data-collection'] });
      toast({
        title: "Data Bulking berhasil disimpan",
        description: response.supplierId 
          ? `Data Bulking dan Supplier telah berhasil dibuat. Supplier ID: ${response.supplierId}` 
          : "Data Bulking telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setBulkingForm({
        ublFacilityId: '',
        namaFasilitasBulking: '',
        namaGroup: '',
        izinBerusaha: '',
        tipeSertifikat: '',
        nomorSertifikat: '',
        lembagaSertifikasi: '',
        ruangLingkupSertifikasi: '',
        masaBerlakuSertifikat: '',
        alamatKantor: '',
        alamatBulking: '',
        modelChainOfCustody: '',
        kapasitasTotal: 0,
        sistemPencatatan: '',
        tanggalPengisianKuisioner: '',
        namaPenanggungJawab: '',
        jabatanPenanggungJawab: '',
        emailPenanggungJawab: '',
        nomorTeleponPenanggungJawab: '',
        namaTimInternal: '',
        jabatanTimInternal: '',
        emailTimInternal: '',
        nomorTeleponTimInternal: ''
      });
    },
  });

  // Document upload functionality
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('/api/objects/upload', 'POST') as any;
      return {
        method: 'PUT' as const,
        url: response.url || response.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string,
    formType: 'estate' | 'mill' | 'smallholders' | 'kcp' | 'bulking'
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects/uploads/${uploadURL.split('/uploads/')[1]}` : 
        `/objects/uploads/${uploadedFile.id || 'unknown'}`;
      
      if (formType === 'estate') {
        setEstateForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'mill') {
        setMillForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'smallholders') {
        setSmallholdersForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'kcp') {
        setKcpForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'bulking') {
        setBulkingForm(prev => ({ ...prev, [fieldName]: objectPath }));
      }
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen telah disimpan dan terhubung dengan formulir ${formType}.`,
      });
    }
  };

  // Note: Kebun management moved to Spatial Analysis step

  // Add Pemasok function
  const addPemasok = () => {
    setSmallholdersForm(prev => ({
      ...prev,
      daftarPetaniPemasokTBS: [
        ...prev.daftarPetaniPemasokTBS,
        {
          no: prev.daftarPetaniPemasokTBS.length + 1,
          namaPetani: '',
          alamatTempatTinggal: '',
          lokasiKebun: '',
          luas: '',
          stdb: '',
          sppl: '',
          nomorObjekPajakPBB: '',
          longitude: '',
          latitude: '',
          polygon: '',
          tahunTanam: ''
        }
      ]
    }));
  };

  // Remove Pemasok function
  const removePemasok = (index: number) => {
    setSmallholdersForm(prev => ({
      ...prev,
      daftarPetaniPemasokTBS: prev.daftarPetaniPemasokTBS.filter((_, i) => i !== index).map((pemasok, i) => ({ ...pemasok, no: i + 1 }))
    }));
  };

  // Add AsalTBS function for Mill form
  const addAsalTBS = () => {
    setMillForm(prev => ({
      ...prev,
      asalTBS: [
        ...prev.asalTBS,
        {
          no: prev.asalTBS.length + 1,
          namaEstateKebun: '',
          alamat: '',
          koordinat: '',
          luasLahan: '',
          jenisSupplierTBS: '',
          volumeTBS: '',
          persentase: ''
        }
      ]
    }));
  };

  // Remove AsalTBS function for Mill form
  const removeAsalTBS = (index: number) => {
    setMillForm(prev => ({
      ...prev,
      asalTBS: prev.asalTBS.filter((_, i) => i !== index).map((asal, i) => ({ ...asal, no: i + 1 }))
    }));
  };

  const handleEstateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEstateMutation.mutate(estateForm);
  };

  const handleSmallholdersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSmallholdersMutation.mutate(smallholdersForm);
  };

  const handleMillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMillMutation.mutate(millForm);
  };

  const handleKcpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createKcpMutation.mutate(kcpForm);
  };

  const handleBulkingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBulkingMutation.mutate(bulkingForm);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 data-testid="text-page-title" className="text-3xl font-bold">
            Data Collection
          </h1>
          <p data-testid="text-page-description" className="text-muted-foreground mt-2">
            Sistem pengumpulan data komprehensif untuk kepatuhan EUDR dengan kemampuan unggah dokumen
          </p>
        </div>

        {/* Revision Mode Banner */}
        {revisionMode && (
          <Card className="border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-500 p-2">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Revision Mode Active</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You are revising a rejected submission. Update the form fields as needed and submit to resubmit for approval.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Approval ID: {revisionMode.approvalId} | Entity Type: {revisionMode.entityType}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supplier Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Supplier Type</CardTitle>
            <CardDescription>
              Choose the supplier type to display the relevant data collection form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={supplierType} onValueChange={setSupplierType}>
              <SelectTrigger className="w-full max-w-md" data-testid="select-supplier-type">
                <SelectValue placeholder="Select supplier type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estate">Estate</SelectItem>
                <SelectItem value="mill">Mill</SelectItem>
                <SelectItem value="smallholders">Smallholders</SelectItem>
                <SelectItem value="kcp">KCP</SelectItem>
                <SelectItem value="bulking">Bulking</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Conditional Form Rendering */}
        {supplierType === 'estate' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Estate</CardTitle>
              <CardDescription>
                (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEstateSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaSupplier">Nama Supplier <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="namaSupplier"
                        data-testid="input-nama-supplier-estate"
                        value={estateForm.namaSupplier}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                        placeholder="Masukkan nama supplier"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaGroup">Nama Group / Parent Company Name</Label>
                      <Input
                        id="namaGroup"
                        data-testid="input-nama-group-estate"
                        value={estateForm.namaGroup}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        placeholder="Masukkan nama group/parent company"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="izinBerusaha">Izin Berusaha (Nomor Induk Berusaha) <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="izinBerusaha"
                        data-testid="input-izin-berusaha-estate"
                        value={estateForm.izinBerusaha}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        placeholder="Masukkan NIB"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jenisKebun">Jenis Kebun</Label>
                      <Select
                        value={estateForm.jenisKebun}
                        onValueChange={(value) => setEstateForm(prev => ({ ...prev, jenisKebun: value }))}
                      >
                        <SelectTrigger data-testid="select-jenis-kebun-estate">
                          <SelectValue placeholder="Pilih jenis kebun..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kebun-sendiri">Kebun Sendiri</SelectItem>
                          <SelectItem value="kebun-satu-manajemen">Kebun Satu Manajemen Pengelolaan</SelectItem>
                          <SelectItem value="third-partied">Third-Partied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatKebun">Alamat Kebun <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Textarea
                        id="alamatKebun"
                        data-testid="input-alamat-kebun-estate"
                        value={estateForm.alamatKebun}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                        placeholder="Masukkan alamat kebun lengkap"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="koordinatKebun">Koordinat Kebun <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="koordinatKebun"
                        data-testid="input-koordinat-kebun-estate"
                        value={estateForm.koordinatKebun}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                        placeholder="Latitude, Longitude"
                        required
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Pendukung</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Akta Pendirian</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirianPerusahaan', 'estate')}
                        >
                          <span>Upload Akta Pendirian</span>
                        </ObjectUploader>
                        {estateForm.aktaPendirianPerusahaan && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Akta Perubahan</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPerubahan', 'estate')}
                        >
                          <span>Upload Akta Perubahan</span>
                        </ObjectUploader>
                        {estateForm.aktaPerubahan && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 2 – Sumber TBS */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Sumber TBS</h3>
                  
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">No</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Nama Kebun</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Alamat</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Koordinat *</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Luas Lahan (Ha)</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Tahun Tanam</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Jenis Bibit</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Produksi TBS 1 Tahun Terakhir</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Actions</th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-1 py-1 text-xs font-medium">
                              <div className="grid grid-cols-3 gap-1">
                                <span>Longitude</span>
                                <span>Latitude</span>
                                <span>Polygon Kebun</span>
                              </div>
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {estateForm.daftarKebun.map((kebun, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                <span className="text-sm">{kebun.no}</span>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.namaKebun}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].namaKebun = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Nama kebun"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Textarea
                                  value={kebun.alamat}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].alamat = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Alamat"
                                  className="text-sm min-h-[60px]"
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-2">
                                <div className="grid grid-cols-3 gap-1">
                                  <Input
                                    value={kebun.koordinatLongitude}
                                    onChange={(e) => {
                                      const newDaftarKebun = [...estateForm.daftarKebun];
                                      newDaftarKebun[index].koordinatLongitude = e.target.value;
                                      setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                    }}
                                    placeholder="Long"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={kebun.koordinatLatitude}
                                    onChange={(e) => {
                                      const newDaftarKebun = [...estateForm.daftarKebun];
                                      newDaftarKebun[index].koordinatLatitude = e.target.value;
                                      setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                    }}
                                    placeholder="Lat"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={kebun.polygonKebun}
                                    onChange={(e) => {
                                      const newDaftarKebun = [...estateForm.daftarKebun];
                                      newDaftarKebun[index].polygonKebun = e.target.value;
                                      setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                    }}
                                    placeholder="Polygon"
                                    className="text-xs"
                                  />
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.luasLahan}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].luasLahan = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Luas (Ha)"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.tahunTanam}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].tahunTanam = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Tahun tanam"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.jenisBibit}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].jenisBibit = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Jenis bibit"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.produksiTBS1TahunTerakhir}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].produksiTBS1TahunTerakhir = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Produksi TBS"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                {estateForm.daftarKebun.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newDaftarKebun = estateForm.daftarKebun.filter((_, i) => i !== index);
                                      // Re-number the remaining items
                                      const renumberedKebun = newDaftarKebun.map((item, i) => ({ ...item, no: i + 1 }));
                                      setEstateForm(prev => ({ ...prev, daftarKebun: renumberedKebun }));
                                    }}
                                    className="text-xs"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEstateForm(prev => ({
                          ...prev,
                          daftarKebun: [
                            ...prev.daftarKebun,
                            {
                              no: prev.daftarKebun.length + 1,
                              namaKebun: '',
                              alamat: '',
                              koordinatLongitude: '',
                              koordinatLatitude: '',
                              polygonKebun: '',
                              luasLahan: '',
                              tahunTanam: '',
                              jenisBibit: '',
                              produksiTBS1TahunTerakhir: ''
                            }
                          ]
                        }));
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Kebun
                    </Button>

                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Keterangan:</strong> *) Jika lebih &gt; 4Ha data Polygon (SHP/GeoJSON)
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createEstateMutation.isPending} data-testid="button-submit-estate">
                    {createEstateMutation.isPending 
                      ? (revisionMode ? 'Resubmitting...' : 'Menyimpan...') 
                      : (revisionMode ? 'Resubmit for Approval' : 'Simpan Data Estate')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'smallholders' && (
          <Card>
            <CardHeader>
              <CardTitle>Form Kemampuan Telusur (Traceability) TBS Luar</CardTitle>
              <CardDescription>
                (Unit Usaha Kecil Menengah/Small Medium Enterprise)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSmallholdersSubmit} className="space-y-8">
                {/* Basic Information Fields */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nomorDO">1. Nomor DO</Label>
                      <Input
                        id="nomorDO"
                        data-testid="input-nomor-do-smallholders"
                        value={smallholdersForm.nomorDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, nomorDO: e.target.value }))}
                        placeholder="Masukkan nomor DO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pemegangDO">2. Pemegang DO</Label>
                      <Input
                        id="pemegangDO"
                        data-testid="input-pemegang-do-smallholders"
                        value={smallholdersForm.pemegangDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, pemegangDO: e.target.value }))}
                        placeholder="Masukkan pemegang DO"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatPemegangDO">3. Alamat Pemegang DO</Label>
                      <Textarea
                        id="alamatPemegangDO"
                        data-testid="input-alamat-pemegang-do-smallholders"
                        value={smallholdersForm.alamatPemegangDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, alamatPemegangDO: e.target.value }))}
                        placeholder="Masukkan alamat pemegang DO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lokasiUsaha">4. Lokasi Usaha</Label>
                      <Textarea
                        id="lokasiUsaha"
                        data-testid="input-lokasi-usaha-smallholders"
                        value={smallholdersForm.lokasiUsaha}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, lokasiUsaha: e.target.value }))}
                        placeholder="( Lokasi Ramp / Alamat Terdaftar CV / Koperasi / Usaha Individu  )"
                      />
                    </div>
                  </div>

                  <h4 className="text-md font-medium mt-6">5. Legalitas Pemegang DO</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nib">NIB</Label>
                      <Input
                        id="nib"
                        data-testid="input-nib-smallholders"
                        value={smallholdersForm.nib}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, nib: e.target.value }))}
                        placeholder="Masukkan NIB"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="npwp">NPWP</Label>
                      <Input
                        id="npwp"
                        data-testid="input-npwp-smallholders"
                        value={smallholdersForm.npwp}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, npwp: e.target.value }))}
                        placeholder="Masukkan NPWP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="luasLahanTertanamPetaniSupplier">6. Luas Lahan Tertanam Petani Supplier</Label>
                      <Input
                        id="luasLahanTertanamPetaniSupplier"
                        data-testid="input-luas-lahan-tertanam-smallholders"
                        value={smallholdersForm.luasLahanTertanamPetaniSupplier}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, luasLahanTertanamPetaniSupplier: e.target.value }))}
                        placeholder="Masukkan luas lahan tertanam"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="volumeTBS">7. Volume TBS</Label>
                      <Input
                        id="volumeTBS"
                        data-testid="input-volume-tbs-smallholders"
                        value={smallholdersForm.volumeTBS}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, volumeTBS: e.target.value }))}
                        placeholder="Masukkan volume TBS"
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Legalitas</h4>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label>Akta Pendirian Usaha ( Jika Berbadan Hukum)</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirianUsaha', 'smallholders')}
                        >
                          <span>Upload Akta Pendirian</span>
                        </ObjectUploader>
                        {smallholdersForm.aktaPendirianUsaha && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Daftar Petani Pemasok TBS */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">6. Daftar Petani Pemasok TBS</h3>
                  
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">No.</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Nama Petani</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Alamat Tempat Tinggal</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Lokasi Kebun</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Luas (Ha)</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Legalitas Lahan</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Tahun Tanam</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Koordinat</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Actions</th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-1 py-1 text-xs font-medium">
                              <div className="grid grid-cols-3 gap-1">
                                <span>STDB</span>
                                <span>SPPL</span>
                                <span>Nomor Objek Pajak PBB</span>
                              </div>
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-1 py-1 text-xs font-medium">
                              <div className="grid grid-cols-3 gap-1">
                                <span>Longitude</span>
                                <span>Latitude</span>
                                <span>Polygon</span>
                              </div>
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {smallholdersForm.daftarPetaniPemasokTBS.map((petani, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                <span className="text-sm">{petani.no}</span>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={petani.namaPetani}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].namaPetani = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Nama petani"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Textarea
                                  value={petani.alamatTempatTinggal}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].alamatTempatTinggal = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Alamat tempat tinggal"
                                  className="text-sm min-h-[60px]"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Textarea
                                  value={petani.lokasiKebun}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].lokasiKebun = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Lokasi kebun"
                                  className="text-sm min-h-[60px]"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={petani.luas}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].luas = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Luas (Ha)"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-2">
                                <div className="grid grid-cols-3 gap-1">
                                  <Input
                                    value={petani.stdb}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].stdb = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="STDB"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={petani.sppl}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].sppl = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="SPPL"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={petani.nomorObjekPajakPBB}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].nomorObjekPajakPBB = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="No Pajak PBB"
                                    className="text-xs"
                                  />
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={petani.tahunTanam}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].tahunTanam = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Tahun tanam"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-2">
                                <div className="grid grid-cols-3 gap-1">
                                  <Input
                                    value={petani.longitude}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].longitude = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="Long"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={petani.latitude}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].latitude = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="Lat"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={petani.polygon}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].polygon = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="Polygon"
                                    className="text-xs"
                                  />
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                {smallholdersForm.daftarPetaniPemasokTBS.length > 1 && (
                                  <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => removePemasok(index)} 
                                    data-testid={`button-remove-pemasok-${index}`}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button type="button" onClick={addPemasok} variant="outline" data-testid="button-add-pemasok">
                        <Plus size={16} className="mr-2" />
                        Tambah Petani Pemasok
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createSmallholdersMutation.isPending} data-testid="button-submit-smallholders">
                    {createSmallholdersMutation.isPending ? 'Menyimpan...' : 'Simpan Data Smallholders'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'mill' && (
          <Card>
            <CardHeader>
              <CardTitle>Form Kemampuan Telusur (Traceability) Pabrik Kelapa Sawit</CardTitle>
              <CardDescription>
                Formulir Pengumpulan Data Pabrik Kelapa Sawit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMillSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="umlId">UML ID</Label>
                      <Input
                        id="umlId"
                        data-testid="input-uml-id-mill"
                        value={millForm.umlId}
                        onChange={(e) => setMillForm(prev => ({ ...prev, umlId: e.target.value }))}
                        placeholder="Masukkan UML ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaPabrik">Nama Pabrik</Label>
                      <Input
                        id="namaPabrik"
                        data-testid="input-nama-pabrik-mill"
                        value={millForm.namaPabrik}
                        onChange={(e) => setMillForm(prev => ({ ...prev, namaPabrik: e.target.value }))}
                        placeholder="Masukkan nama pabrik"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaGroup">Nama Group</Label>
                      <Input
                        id="namaGroup"
                        data-testid="input-nama-group-mill"
                        value={millForm.namaGroup}
                        onChange={(e) => setMillForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        placeholder="Masukkan nama group"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="alamatKantor">Alamat Kantor</Label>
                      <Textarea
                        id="alamatKantor"
                        data-testid="input-alamat-kantor-mill"
                        value={millForm.alamatKantor}
                        onChange={(e) => setMillForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                        placeholder="Masukkan alamat kantor"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatPabrik">Alamat Pabrik</Label>
                      <Textarea
                        id="alamatPabrik"
                        data-testid="input-alamat-pabrik-mill"
                        value={millForm.alamatPabrik}
                        onChange={(e) => setMillForm(prev => ({ ...prev, alamatPabrik: e.target.value }))}
                        placeholder="Masukkan alamat pabrik"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="koordinatPabrik">Koordinat Pabrik</Label>
                      <Input
                        id="koordinatPabrik"
                        data-testid="input-koordinat-pabrik-mill"
                        value={millForm.koordinatPabrik}
                        onChange={(e) => setMillForm(prev => ({ ...prev, koordinatPabrik: e.target.value }))}
                        placeholder="Masukkan koordinat pabrik"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="koordinatKantor">Koordinat Kantor</Label>
                      <Input
                        id="koordinatKantor"
                        data-testid="input-koordinat-kantor-mill"
                        value={millForm.koordinatKantor}
                        onChange={(e) => setMillForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                        placeholder="Masukkan koordinat kantor"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="izinBerusaha">Izin Berusaha (NIB)</Label>
                      <Input
                        id="izinBerusaha"
                        data-testid="input-izin-berusaha-mill"
                        value={millForm.izinBerusaha}
                        onChange={(e) => setMillForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        placeholder="Masukkan NIB"
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Legalitas</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Akta Pendirian</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirian', 'mill')}
                        >
                          <span>Upload Akta Pendirian</span>
                        </ObjectUploader>
                        {millForm.aktaPendirian && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Akta Perubahan</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPerubahan', 'mill')}
                        >
                          <span>Upload Akta Perubahan</span>
                        </ObjectUploader>
                        {millForm.aktaPerubahan && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Certification Section */}
                  <h4 className="text-md font-medium">Informasi Sertifikasi</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tipeSertifikat">Tipe Sertifikat</Label>
                      <Input
                        id="tipeSertifikat"
                        data-testid="input-tipe-sertifikat-mill"
                        value={millForm.tipeSertifikat}
                        onChange={(e) => setMillForm(prev => ({ ...prev, tipeSertifikat: e.target.value }))}
                        placeholder="ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorSertifikat">Nomor Sertifikat</Label>
                      <Input
                        id="nomorSertifikat"
                        data-testid="input-nomor-sertifikat-mill"
                        value={millForm.nomorSertifikat}
                        onChange={(e) => setMillForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                        placeholder="Masukkan nomor sertifikat"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lembagaSertifikasi">Lembaga Sertifikasi</Label>
                      <Input
                        id="lembagaSertifikasi"
                        data-testid="input-lembaga-sertifikasi-mill"
                        value={millForm.lembagaSertifikasi}
                        onChange={(e) => setMillForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                        placeholder="Masukkan lembaga sertifikasi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ruangLingkupSertifikasi">Ruang Lingkup Sertifikasi</Label>
                      <Input
                        id="ruangLingkupSertifikasi"
                        data-testid="input-ruang-lingkup-sertifikasi-mill"
                        value={millForm.ruangLingkupSertifikasi}
                        onChange={(e) => setMillForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                        placeholder="Masukkan ruang lingkup sertifikasi"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="masaBerlakuSertifikat">Masa Berlaku Sertifikat</Label>
                      <Input
                        id="masaBerlakuSertifikat"
                        data-testid="input-masa-berlaku-sertifikat-mill"
                        value={millForm.masaBerlakuSertifikat}
                        onChange={(e) => setMillForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                        placeholder="Masukkan masa berlaku sertifikat"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2 - Data Internal */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Data Internal</h3>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="jenisSupplier">Jenis Supplier</Label>
                      <Select
                        value={millForm.jenisSupplier}
                        onValueChange={(value) => setMillForm(prev => ({ ...prev, jenisSupplier: value }))}
                      >
                        <SelectTrigger data-testid="select-jenis-supplier-mill">
                          <SelectValue placeholder="Pilih jenis supplier..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kkpa">KKPA</SelectItem>
                          <SelectItem value="sister-company">Sister Company</SelectItem>
                          <SelectItem value="pihak-ketiga">Pihak Ketiga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kuantitasCPOPK">Kuantitas CPO/PK (M/T)</Label>
                      <Input
                        id="kuantitasCPOPK"
                        data-testid="input-kuantitas-cpo-pk-mill"
                        value={millForm.kuantitasCPOPK}
                        onChange={(e) => setMillForm(prev => ({ ...prev, kuantitasCPOPK: e.target.value }))}
                        placeholder="Masukkan kuantitas dalam M/T"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tanggalPengisianKuisioner">Tanggal Pengisian Kuisioner</Label>
                      <Input
                        id="tanggalPengisianKuisioner"
                        data-testid="input-tanggal-pengisian-mill"
                        type="date"
                        value={millForm.tanggalPengisianKuisioner}
                        onChange={(e) => setMillForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <h4 className="text-md font-medium">Penanggung Jawab</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaPenanggungJawab">Nama Penanggung Jawab</Label>
                      <Input
                        id="namaPenanggungJawab"
                        data-testid="input-nama-penanggung-jawab-mill"
                        value={millForm.namaPenanggungJawab}
                        onChange={(e) => setMillForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan nama penanggung jawab"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jabatanPenanggungJawab">Jabatan Penanggung Jawab</Label>
                      <Input
                        id="jabatanPenanggungJawab"
                        data-testid="input-jabatan-penanggung-jawab-mill"
                        value={millForm.jabatanPenanggungJawab}
                        onChange={(e) => setMillForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan jabatan penanggung jawab"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailPenanggungJawab">Email Penanggung Jawab</Label>
                      <Input
                        id="emailPenanggungJawab"
                        data-testid="input-email-penanggung-jawab-mill"
                        type="email"
                        value={millForm.emailPenanggungJawab}
                        onChange={(e) => setMillForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan email penanggung jawab"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorTeleponPenanggungJawab">Nomor Telepon Penanggung Jawab</Label>
                      <Input
                        id="nomorTeleponPenanggungJawab"
                        data-testid="input-nomor-telepon-penanggung-jawab-mill"
                        value={millForm.nomorTeleponPenanggungJawab}
                        onChange={(e) => setMillForm(prev => ({ ...prev, nomorTeleponPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan nomor telepon penanggung jawab"
                      />
                    </div>
                  </div>

                  <h4 className="text-md font-medium">Tim Internal</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaTimInternal">Nama Tim Internal</Label>
                      <Input
                        id="namaTimInternal"
                        data-testid="input-nama-tim-internal-mill"
                        value={millForm.namaTimInternal}
                        onChange={(e) => setMillForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                        placeholder="Masukkan nama tim internal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jabatanTimInternal">Jabatan Tim Internal</Label>
                      <Input
                        id="jabatanTimInternal"
                        data-testid="input-jabatan-tim-internal-mill"
                        value={millForm.jabatanTimInternal}
                        onChange={(e) => setMillForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                        placeholder="Masukkan jabatan tim internal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailTimInternal">Email Tim Internal</Label>
                      <Input
                        id="emailTimInternal"
                        data-testid="input-email-tim-internal-mill"
                        type="email"
                        value={millForm.emailTimInternal}
                        onChange={(e) => setMillForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                        placeholder="Masukkan email tim internal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorTeleponTimInternal">Nomor Telepon Tim Internal</Label>
                      <Input
                        id="nomorTeleponTimInternal"
                        data-testid="input-nomor-telepon-tim-internal-mill"
                        value={millForm.nomorTeleponTimInternal}
                        onChange={(e) => setMillForm(prev => ({ ...prev, nomorTeleponTimInternal: e.target.value }))}
                        placeholder="Masukkan nomor telepon tim internal"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 3 - Asal TBS */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 3 – Asal TBS</h3>
                  
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">No.</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Nama Estate/Kebun</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Alamat</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Koordinat</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Luas Lahan (Ha)</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Jenis Supplier TBS</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Volume TBS (Ton/bulan)</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Persentase (%)</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {millForm.asalTBS.map((asal, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                <span className="text-sm">{asal.no}</span>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={asal.namaEstateKebun}
                                  onChange={(e) => {
                                    const newAsalTBS = [...millForm.asalTBS];
                                    newAsalTBS[index].namaEstateKebun = e.target.value;
                                    setMillForm(prev => ({ ...prev, asalTBS: newAsalTBS }));
                                  }}
                                  placeholder="Nama estate/kebun"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Textarea
                                  value={asal.alamat}
                                  onChange={(e) => {
                                    const newAsalTBS = [...millForm.asalTBS];
                                    newAsalTBS[index].alamat = e.target.value;
                                    setMillForm(prev => ({ ...prev, asalTBS: newAsalTBS }));
                                  }}
                                  placeholder="Alamat"
                                  className="text-sm min-h-[60px]"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={asal.koordinat}
                                  onChange={(e) => {
                                    const newAsalTBS = [...millForm.asalTBS];
                                    newAsalTBS[index].koordinat = e.target.value;
                                    setMillForm(prev => ({ ...prev, asalTBS: newAsalTBS }));
                                  }}
                                  placeholder="Koordinat"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={asal.luasLahan}
                                  onChange={(e) => {
                                    const newAsalTBS = [...millForm.asalTBS];
                                    newAsalTBS[index].luasLahan = e.target.value;
                                    setMillForm(prev => ({ ...prev, asalTBS: newAsalTBS }));
                                  }}
                                  placeholder="Luas (Ha)"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Select
                                  value={asal.jenisSupplierTBS}
                                  onValueChange={(value) => {
                                    const newAsalTBS = [...millForm.asalTBS];
                                    newAsalTBS[index].jenisSupplierTBS = value;
                                    setMillForm(prev => ({ ...prev, asalTBS: newAsalTBS }));
                                  }}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Pilih..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="estate-sendiri">Estate Sendiri</SelectItem>
                                    <SelectItem value="pihak-ketiga">Pihak Ketiga</SelectItem>
                                    <SelectItem value="smallholder">Smallholder</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={asal.volumeTBS}
                                  onChange={(e) => {
                                    const newAsalTBS = [...millForm.asalTBS];
                                    newAsalTBS[index].volumeTBS = e.target.value;
                                    setMillForm(prev => ({ ...prev, asalTBS: newAsalTBS }));
                                  }}
                                  placeholder="Volume TBS"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={asal.persentase}
                                  onChange={(e) => {
                                    const newAsalTBS = [...millForm.asalTBS];
                                    newAsalTBS[index].persentase = e.target.value;
                                    setMillForm(prev => ({ ...prev, asalTBS: newAsalTBS }));
                                  }}
                                  placeholder="Persentase"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                {millForm.asalTBS.length > 1 && (
                                  <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => removeAsalTBS(index)} 
                                    data-testid={`button-remove-asal-tbs-${index}`}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button type="button" onClick={addAsalTBS} variant="outline" data-testid="button-add-asal-tbs">
                        <Plus size={16} className="mr-2" />
                        Tambah Asal TBS
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createMillMutation.isPending} data-testid="button-submit-mill">
                    {createMillMutation.isPending ? 'Menyimpan...' : 'Simpan Data Mill'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'kcp' && (
          <Card>
            <CardHeader>
              <CardTitle>Form Kemampuan Telusur (Traceability) KCP</CardTitle>
              <CardDescription>
                Formulir Pengumpulan Data Kernel Crushing Plant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleKcpSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ublFacilityId">UBL Facility ID</Label>
                      <Input
                        id="ublFacilityId"
                        data-testid="input-ubl-facility-id-kcp"
                        value={kcpForm.ublFacilityId}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, ublFacilityId: e.target.value }))}
                        placeholder="Masukkan UBL Facility ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaKCP">Nama KCP</Label>
                      <Input
                        id="namaKCP"
                        data-testid="input-nama-kcp"
                        value={kcpForm.namaKCP}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, namaKCP: e.target.value }))}
                        placeholder="Masukkan nama KCP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaGroup">Nama Group</Label>
                      <Input
                        id="namaGroup"
                        data-testid="input-nama-group-kcp"
                        value={kcpForm.namaGroup}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        placeholder="Masukkan nama group"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="alamatKantor">Alamat Kantor</Label>
                      <Textarea
                        id="alamatKantor"
                        data-testid="input-alamat-kantor-kcp"
                        value={kcpForm.alamatKantor}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                        placeholder="Masukkan alamat kantor"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatKCP">Alamat KCP</Label>
                      <Textarea
                        id="alamatKCP"
                        data-testid="input-alamat-kcp"
                        value={kcpForm.alamatKCP}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, alamatKCP: e.target.value }))}
                        placeholder="Masukkan alamat KCP"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="koordinatKantor">Koordinat Kantor</Label>
                      <Input
                        id="koordinatKantor"
                        data-testid="input-koordinat-kantor-kcp"
                        value={kcpForm.koordinatKantor}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                        placeholder="Masukkan koordinat kantor"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="koordinatKCP">Koordinat KCP</Label>
                      <Input
                        id="koordinatKCP"
                        data-testid="input-koordinat-kcp"
                        value={kcpForm.koordinatKCP}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, koordinatKCP: e.target.value }))}
                        placeholder="Masukkan koordinat KCP"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="izinBerusaha">Izin Berusaha (NIB)</Label>
                      <Input
                        id="izinBerusaha"
                        data-testid="input-izin-berusaha-kcp"
                        value={kcpForm.izinBerusaha}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        placeholder="Masukkan NIB"
                      />
                    </div>
                  </div>

                  {/* Certification Section */}
                  <h4 className="text-md font-medium">Informasi Sertifikasi</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tipeSertifikat">Tipe Sertifikat</Label>
                      <Input
                        id="tipeSertifikat"
                        data-testid="input-tipe-sertifikat-kcp"
                        value={kcpForm.tipeSertifikat}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, tipeSertifikat: e.target.value }))}
                        placeholder="ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorSertifikat">Nomor Sertifikat</Label>
                      <Input
                        id="nomorSertifikat"
                        data-testid="input-nomor-sertifikat-kcp"
                        value={kcpForm.nomorSertifikat}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                        placeholder="Masukkan nomor sertifikat"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lembagaSertifikasi">Lembaga Sertifikasi</Label>
                      <Input
                        id="lembagaSertifikasi"
                        data-testid="input-lembaga-sertifikasi-kcp"
                        value={kcpForm.lembagaSertifikasi}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                        placeholder="Masukkan lembaga sertifikasi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ruangLingkupSertifikasi">Ruang Lingkup Sertifikasi</Label>
                      <Input
                        id="ruangLingkupSertifikasi"
                        data-testid="input-ruang-lingkup-sertifikasi-kcp"
                        value={kcpForm.ruangLingkupSertifikasi}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                        placeholder="Masukkan ruang lingkup sertifikasi"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="masaBerlakuSertifikat">Masa Berlaku Sertifikat</Label>
                      <Input
                        id="masaBerlakuSertifikat"
                        data-testid="input-masa-berlaku-sertifikat-kcp"
                        value={kcpForm.masaBerlakuSertifikat}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                        placeholder="Masukkan masa berlaku sertifikat"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2 - Data Internal */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Data Internal</h3>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="modelChainOfCustody">Model Chain of Custody</Label>
                      <Select
                        value={kcpForm.modelChainOfCustody}
                        onValueChange={(value) => setKcpForm(prev => ({ ...prev, modelChainOfCustody: value }))}
                      >
                        <SelectTrigger data-testid="select-model-chain-custody-kcp">
                          <SelectValue placeholder="Pilih model chain of custody..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="segregasi">Segregasi</SelectItem>
                          <SelectItem value="mass-balance">Mass Balance</SelectItem>
                          <SelectItem value="book-claim">Book & Claim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kapasitasOlahMTHari">Kapasitas Olah (MT/Hari)</Label>
                      <Input
                        id="kapasitasOlahMTHari"
                        data-testid="input-kapasitas-olah-mt-hari-kcp"
                        type="number"
                        value={kcpForm.kapasitasOlahMTHari}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, kapasitasOlahMTHari: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan kapasitas olah"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kapasitasOlah">Kapasitas Olah (MT/Bulan)</Label>
                      <Input
                        id="kapasitasOlah"
                        data-testid="input-kapasitas-olah-kcp"
                        type="number"
                        value={kcpForm.kapasitasOlah}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, kapasitasOlah: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan kapasitas olah bulanan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sistemPencatatan">Sistem Pencatatan</Label>
                      <Select
                        value={kcpForm.sistemPencatatan}
                        onValueChange={(value) => setKcpForm(prev => ({ ...prev, sistemPencatatan: value }))}
                      >
                        <SelectTrigger data-testid="select-sistem-pencatatan-kcp">
                          <SelectValue placeholder="Pilih sistem pencatatan..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="kombinasi">Kombinasi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tanggalPengisianKuisioner">Tanggal Pengisian Kuisioner</Label>
                      <Input
                        id="tanggalPengisianKuisioner"
                        data-testid="input-tanggal-pengisian-kcp"
                        type="date"
                        value={kcpForm.tanggalPengisianKuisioner}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <h4 className="text-md font-medium">Penanggung Jawab</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaPenanggungJawab">Nama Penanggung Jawab</Label>
                      <Input
                        id="namaPenanggungJawab"
                        data-testid="input-nama-penanggung-jawab-kcp"
                        value={kcpForm.namaPenanggungJawab}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan nama penanggung jawab"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jabatanPenanggungJawab">Jabatan Penanggung Jawab</Label>
                      <Input
                        id="jabatanPenanggungJawab"
                        data-testid="input-jabatan-penanggung-jawab-kcp"
                        value={kcpForm.jabatanPenanggungJawab}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan jabatan penanggung jawab"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailPenanggungJawab">Email Penanggung Jawab</Label>
                      <Input
                        id="emailPenanggungJawab"
                        data-testid="input-email-penanggung-jawab-kcp"
                        type="email"
                        value={kcpForm.emailPenanggungJawab}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan email penanggung jawab"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorTeleponPenanggungJawab">Nomor Telepon Penanggung Jawab</Label>
                      <Input
                        id="nomorTeleponPenanggungJawab"
                        data-testid="input-nomor-telepon-penanggung-jawab-kcp"
                        value={kcpForm.nomorTeleponPenanggungJawab}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, nomorTeleponPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan nomor telepon penanggung jawab"
                      />
                    </div>
                  </div>

                  <h4 className="text-md font-medium">Tim Internal</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaTimInternal">Nama Tim Internal</Label>
                      <Input
                        id="namaTimInternal"
                        data-testid="input-nama-tim-internal-kcp"
                        value={kcpForm.namaTimInternal}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                        placeholder="Masukkan nama tim internal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jabatanTimInternal">Jabatan Tim Internal</Label>
                      <Input
                        id="jabatanTimInternal"
                        data-testid="input-jabatan-tim-internal-kcp"
                        value={kcpForm.jabatanTimInternal}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                        placeholder="Masukkan jabatan tim internal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailTimInternal">Email Tim Internal</Label>
                      <Input
                        id="emailTimInternal"
                        data-testid="input-email-tim-internal-kcp"
                        type="email"
                        value={kcpForm.emailTimInternal}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                        placeholder="Masukkan email tim internal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorTeleponTimInternal">Nomor Telepon Tim Internal</Label>
                      <Input
                        id="nomorTeleponTimInternal"
                        data-testid="input-nomor-telepon-tim-internal-kcp"
                        value={kcpForm.nomorTeleponTimInternal}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, nomorTeleponTimInternal: e.target.value }))}
                        placeholder="Masukkan nomor telepon tim internal"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createKcpMutation.isPending} data-testid="button-submit-kcp">
                    {createKcpMutation.isPending ? 'Menyimpan...' : 'Simpan Data KCP'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'bulking' && (
          <Card>
            <CardHeader>
              <CardTitle>Form Kemampuan Telusur (Traceability) Fasilitas Bulking</CardTitle>
              <CardDescription>
                Formulir Pengumpulan Data Fasilitas Bulking/Storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkingSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ublFacilityId">UBL Facility ID</Label>
                      <Input
                        id="ublFacilityId"
                        data-testid="input-ubl-facility-id-bulking"
                        value={bulkingForm.ublFacilityId}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, ublFacilityId: e.target.value }))}
                        placeholder="Masukkan UBL Facility ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaFasilitasBulking">Nama Fasilitas Bulking</Label>
                      <Input
                        id="namaFasilitasBulking"
                        data-testid="input-nama-fasilitas-bulking"
                        value={bulkingForm.namaFasilitasBulking}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, namaFasilitasBulking: e.target.value }))}
                        placeholder="Masukkan nama fasilitas bulking"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaGroup">Nama Group</Label>
                      <Input
                        id="namaGroup"
                        data-testid="input-nama-group-bulking"
                        value={bulkingForm.namaGroup}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        placeholder="Masukkan nama group"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="alamatKantor">Alamat Kantor</Label>
                      <Textarea
                        id="alamatKantor"
                        data-testid="input-alamat-kantor-bulking"
                        value={bulkingForm.alamatKantor}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                        placeholder="Masukkan alamat kantor"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatBulking">Alamat Fasilitas Bulking</Label>
                      <Textarea
                        id="alamatBulking"
                        data-testid="input-alamat-bulking"
                        value={bulkingForm.alamatBulking}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, alamatBulking: e.target.value }))}
                        placeholder="Masukkan alamat fasilitas bulking"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="izinBerusaha">Izin Berusaha (NIB)</Label>
                      <Input
                        id="izinBerusaha"
                        data-testid="input-izin-berusaha-bulking"
                        value={bulkingForm.izinBerusaha}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        placeholder="Masukkan NIB"
                      />
                    </div>
                  </div>

                  {/* Certification Section */}
                  <h4 className="text-md font-medium">Informasi Sertifikasi</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tipeSertifikat">Tipe Sertifikat</Label>
                      <Input
                        id="tipeSertifikat"
                        data-testid="input-tipe-sertifikat-bulking"
                        value={bulkingForm.tipeSertifikat}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, tipeSertifikat: e.target.value }))}
                        placeholder="ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorSertifikat">Nomor Sertifikat</Label>
                      <Input
                        id="nomorSertifikat"
                        data-testid="input-nomor-sertifikat-bulking"
                        value={bulkingForm.nomorSertifikat}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                        placeholder="Masukkan nomor sertifikat"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lembagaSertifikasi">Lembaga Sertifikasi</Label>
                      <Input
                        id="lembagaSertifikasi"
                        data-testid="input-lembaga-sertifikasi-bulking"
                        value={bulkingForm.lembagaSertifikasi}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                        placeholder="Masukkan lembaga sertifikasi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ruangLingkupSertifikasi">Ruang Lingkup Sertifikasi</Label>
                      <Input
                        id="ruangLingkupSertifikasi"
                        data-testid="input-ruang-lingkup-sertifikasi-bulking"
                        value={bulkingForm.ruangLingkupSertifikasi}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                        placeholder="Masukkan ruang lingkup sertifikasi"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="masaBerlakuSertifikat">Masa Berlaku Sertifikat</Label>
                      <Input
                        id="masaBerlakuSertifikat"
                        data-testid="input-masa-berlaku-sertifikat-bulking"
                        value={bulkingForm.masaBerlakuSertifikat}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                        placeholder="Masukkan masa berlaku sertifikat"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2 - Data Internal */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Data Internal</h3>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="modelChainOfCustody">Model Chain of Custody</Label>
                      <Select
                        value={bulkingForm.modelChainOfCustody}
                        onValueChange={(value) => setBulkingForm(prev => ({ ...prev, modelChainOfCustody: value }))}
                      >
                        <SelectTrigger data-testid="select-model-chain-custody-bulking">
                          <SelectValue placeholder="Pilih model chain of custody..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="segregasi">Segregasi</SelectItem>
                          <SelectItem value="mass-balance">Mass Balance</SelectItem>
                          <SelectItem value="book-claim">Book & Claim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kapasitasTotal">Kapasitas Total (MT)</Label>
                      <Input
                        id="kapasitasTotal"
                        data-testid="input-kapasitas-total-bulking"
                        type="number"
                        value={bulkingForm.kapasitasTotal}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, kapasitasTotal: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan kapasitas total"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sistemPencatatan">Sistem Pencatatan</Label>
                      <Select
                        value={bulkingForm.sistemPencatatan}
                        onValueChange={(value) => setBulkingForm(prev => ({ ...prev, sistemPencatatan: value }))}
                      >
                        <SelectTrigger data-testid="select-sistem-pencatatan-bulking">
                          <SelectValue placeholder="Pilih sistem pencatatan..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="kombinasi">Kombinasi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tanggalPengisianKuisioner">Tanggal Pengisian Kuisioner</Label>
                      <Input
                        id="tanggalPengisianKuisioner"
                        data-testid="input-tanggal-pengisian-bulking"
                        type="date"
                        value={bulkingForm.tanggalPengisianKuisioner}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <h4 className="text-md font-medium">Penanggung Jawab</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaPenanggungJawab">Nama Penanggung Jawab</Label>
                      <Input
                        id="namaPenanggungJawab"
                        data-testid="input-nama-penanggung-jawab-bulking"
                        value={bulkingForm.namaPenanggungJawab}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan nama penanggung jawab"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jabatanPenanggungJawab">Jabatan Penanggung Jawab</Label>
                      <Input
                        id="jabatanPenanggungJawab"
                        data-testid="input-jabatan-penanggung-jawab-bulking"
                        value={bulkingForm.jabatanPenanggungJawab}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan jabatan penanggung jawab"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailPenanggungJawab">Email Penanggung Jawab</Label>
                      <Input
                        id="emailPenanggungJawab"
                        data-testid="input-email-penanggung-jawab-bulking"
                        type="email"
                        value={bulkingForm.emailPenanggungJawab}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan email penanggung jawab"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorTeleponPenanggungJawab">Nomor Telepon Penanggung Jawab</Label>
                      <Input
                        id="nomorTelefonPenanggungJawab"
                        data-testid="input-nomor-telepon-penanggung-jawab-bulking"
                        value={bulkingForm.nomorTeleponPenanggungJawab}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, nomorTeleponPenanggungJawab: e.target.value }))}
                        placeholder="Masukkan nomor telepon penanggung jawab"
                      />
                    </div>
                  </div>

                  <h4 className="text-md font-medium">Tim Internal</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaTimInternal">Nama Tim Internal</Label>
                      <Input
                        id="namaTimInternal"
                        data-testid="input-nama-tim-internal-bulking"
                        value={bulkingForm.namaTimInternal}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                        placeholder="Masukkan nama tim internal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jabatanTimInternal">Jabatan Tim Internal</Label>
                      <Input
                        id="jabatanTimInternal"
                        data-testid="input-jabatan-tim-internal-bulking"
                        value={bulkingForm.jabatanTimInternal}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                        placeholder="Masukkan jabatan tim internal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailTimInternal">Email Tim Internal</Label>
                      <Input
                        id="emailTimInternal"
                        data-testid="input-email-tim-internal-bulking"
                        type="email"
                        value={bulkingForm.emailTimInternal}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                        placeholder="Masukkan email tim internal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomorTeleponTimInternal">Nomor Telepon Tim Internal</Label>
                      <Input
                        id="nomorTeleponTimInternal"
                        data-testid="input-nomor-telepon-tim-internal-bulking"
                        value={bulkingForm.nomorTeleponTimInternal}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, nomorTeleponTimInternal: e.target.value }))}
                        placeholder="Masukkan nomor telepon tim internal"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createBulkingMutation.isPending} data-testid="button-submit-bulking">
                    {createBulkingMutation.isPending ? 'Menyimpan...' : 'Simpan Data Bulking'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Submitted Data Tables */}
        {(estateData.length > 0 || millData.length > 0 || smallholderData.length > 0 || kcpData.length > 0 || bulkingData.length > 0) && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Submitted Data Collections</h2>

            {/* Estate Data Table */}
            {estateData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Estate Data Collection Records</CardTitle>
                  <CardDescription>All submitted estate data collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table data-testid="table-estate-records">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Supplier Name</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Office Address</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estateData.map((record: any) => (
                          <TableRow key={record.id} data-testid={`row-estate-${record.id}`}>
                            <TableCell className="font-mono text-xs">{record.id.slice(0, 8)}...</TableCell>
                            <TableCell className="font-medium">{record.namaSupplier || '-'}</TableCell>
                            <TableCell>{record.namaPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.emailPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.nomorTeleponPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.alamatKantor || '-'}</TableCell>
                            <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mill Data Table */}
            {millData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Mill Data Collection Records</CardTitle>
                  <CardDescription>All submitted mill data collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table data-testid="table-mill-records">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Mill Name</TableHead>
                          <TableHead>UML ID</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {millData.map((record: any) => (
                          <TableRow key={record.id} data-testid={`row-mill-${record.id}`}>
                            <TableCell className="font-mono text-xs">{record.id.slice(0, 8)}...</TableCell>
                            <TableCell className="font-medium">{record.namaPabrik || '-'}</TableCell>
                            <TableCell>{record.umlId || '-'}</TableCell>
                            <TableCell>{record.namaPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.emailPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.nomorTeleponPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Smallholder/Traceability Data Table */}
            {smallholderData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Smallholder/Traceability Data Records</CardTitle>
                  <CardDescription>All submitted traceability data collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table data-testid="table-smallholder-records">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>DO Number</TableHead>
                          <TableHead>DO Holder</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Business Location</TableHead>
                          <TableHead>NIB</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {smallholderData.map((record: any) => (
                          <TableRow key={record.id} data-testid={`row-smallholder-${record.id}`}>
                            <TableCell className="font-mono text-xs">{record.id}</TableCell>
                            <TableCell className="font-medium">{record.nomorDO || '-'}</TableCell>
                            <TableCell>{record.pemegangDO || '-'}</TableCell>
                            <TableCell>{record.alamatPemegangDO || '-'}</TableCell>
                            <TableCell>{record.lokasiUsaha || '-'}</TableCell>
                            <TableCell>{record.nib || '-'}</TableCell>
                            <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KCP Data Table */}
            {kcpData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>KCP Data Collection Records</CardTitle>
                  <CardDescription>All submitted KCP data collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table data-testid="table-kcp-records">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>KCP Name</TableHead>
                          <TableHead>Facility ID</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kcpData.map((record: any) => (
                          <TableRow key={record.id} data-testid={`row-kcp-${record.id}`}>
                            <TableCell className="font-mono text-xs">{record.id}</TableCell>
                            <TableCell className="font-medium">{record.namaKCP || '-'}</TableCell>
                            <TableCell>{record.ublFacilityId || '-'}</TableCell>
                            <TableCell>{record.namaPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.emailPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.alamatKantor || '-'}</TableCell>
                            <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bulking Data Table */}
            {bulkingData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Bulking Data Collection Records</CardTitle>
                  <CardDescription>All submitted bulking data collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table data-testid="table-bulking-records">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Facility Name</TableHead>
                          <TableHead>Facility ID</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkingData.map((record: any) => (
                          <TableRow key={record.id} data-testid={`row-bulking-${record.id}`}>
                            <TableCell className="font-mono text-xs">{record.id}</TableCell>
                            <TableCell className="font-medium">{record.namaFasilitasBulking || '-'}</TableCell>
                            <TableCell>{record.ublFacilityId || '-'}</TableCell>
                            <TableCell>{record.namaPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.emailPenanggungJawab || '-'}</TableCell>
                            <TableCell>{record.alamatKantor || '-'}</TableCell>
                            <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* View Consolidated Results CTA - Show when any supplier type is selected */}
        {supplierType && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    View Consolidated Assessment Results
                  </h3>
                  <p className="text-blue-700 mb-4 max-w-2xl mx-auto">
                    Review comprehensive supplier assessments with AI-powered analysis, compliance scoring, and risk evaluation across all your data collection efforts.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/supply-chain-analysis'}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-medium"
                  data-testid="button-view-consolidated-results"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Consolidated Results & Analysis
                  <span className="ml-2">→</span>
                </Button>
                <p className="text-sm text-blue-600 mt-2">
                  Access detailed reports, compliance status, and risk assessments
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}